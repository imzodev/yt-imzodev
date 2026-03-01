import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncSnippets() {
  const contentDir = path.join(process.cwd(), 'src/content/snippets');
  
  try {
    // Ensure directory exists
    await fs.access(contentDir);
  } catch {
    console.log(`Directory ${contentDir} does not exist. Nothing to sync.`);
    return;
  }

  const files = await fs.readdir(contentDir);
  const mdFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));

  console.log(`Found ${mdFiles.length} snippets to sync...`);

  // First, get the admin user ID
  const { data: users } = await supabase.from('users').select('id').limit(1);
  const adminId = users?.[0]?.id;

  if (!adminId) {
    console.error('No users found in database to assign as author.');
    process.exit(1);
  }

  for (const file of mdFiles) {
    const filePath = path.join(contentDir, file);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Get category ID
    let categoryId = null;
    if (frontmatter.category) {
      const { data: catData } = await supabase
        .from('snippet_categories')
        .select('id')
        .eq('slug', frontmatter.category)
        .single();
      
      categoryId = catData?.id;

      if (!categoryId) {
        // Create category if it doesn't exist
        const { data: newCat } = await supabase
          .from('snippet_categories')
          .insert({ name: frontmatter.category, slug: frontmatter.category, description: `${frontmatter.category} category` })
          .select()
          .single();
        categoryId = newCat?.id;
      }
    }

    const title = frontmatter.title || file.replace(/\.mdx?$/, '');

    const snippetData = {
      title,
      content: content.trim(),
      description: frontmatter.description || '',
      language: frontmatter.language || 'typescript',
      type: frontmatter.type || 'component',
      category_id: categoryId,
      author_id: adminId,
      tags: frontmatter.tags || [],
      access_level: frontmatter.access_level || 'free',
      is_active: frontmatter.is_active !== undefined ? frontmatter.is_active : true,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('snippets')
      .upsert(snippetData, { onConflict: 'title' });

    if (error) {
      console.error(`❌ Failed to sync ${file}:`, error.message);
    } else {
      console.log(`✅ Synced: ${snippetData.title}`);
    }
  }

  console.log('Done syncing snippets!');
}

syncSnippets().catch(console.error);
