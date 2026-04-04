/**
 * Base styles for email templates
 */
const baseStyles = `
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    background-color: #f4f4f5;
  }
  .container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
  .header {
    text-align: center;
    padding: 40px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 12px 12px 0 0;
  }
  .logo {
    font-size: 24px;
    font-weight: bold;
    color: white;
    text-decoration: none;
  }
  .content {
    background-color: white;
    padding: 40px 20px;
    border-radius: 0 0 12px 12px;
  }
  .title {
    font-size: 28px;
    margin: 0 0 20px;
    color: #333;
  }
  .body {
    font-size: 16px;
    line-height: 1.6;
    color: #555;
  }
  .button {
    display: inline-block;
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    margin: 20px 0;
  }
  .footer {
    text-align: center;
    padding: 30px 20px;
    color: #888;
    font-size: 14px;
  }
  .footer a {
    color: #667eea;
    text-decoration: none;
  }
  .divider {
    height: 1px;
    background-color: #e4e4e4;
    margin: 30px 0;
  }
`;

export interface EmailTemplateData {
  email: string;
  subscriberId: number;
  baseUrl: string;
  title?: string;
  content?: string;
  ctaText?: string;
  ctaUrl?: string;
  unsubscribeLink?: string;
}

/**
 * Generate unsubscribe link for email
 */
export function generateUnsubscribeLink(email: string, subscriberId: number, baseUrl: string): string {
  const token = Buffer.from(`${email}:${subscriberId}`).toString('base64');
  return `${baseUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

/**
 * Welcome email template
 */
export function welcomeEmailTemplate(data: EmailTemplateData): string {
  const unsubscribeLink = data.unsubscribeLink || generateUnsubscribeLink(data.email, data.subscriberId, data.baseUrl);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Newsletter</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${data.baseUrl}" class="logo">imzodev</a>
    </div>
    <div class="content">
      <h1 class="title">Welcome to the Newsletter! 🎉</h1>
      <div class="body">
        <p>Thanks for subscribing!</p>
        <p>You'll now receive updates about:</p>
        <ul>
          <li>🎬 New video releases</li>
          <li>📝 Blog posts and tutorials</li>
          <li>💡 Exclusive tips and tricks</li>
          <li>🌟 Community highlights</li>
        </ul>
        <p>Stay tuned for our next update!</p>
      </div>
    </div>
    <div class="footer">
      <p>
        <a href="${data.baseUrl}">Visit Website</a> · 
        <a href="${unsubscribeLink}">Unsubscribe</a>
      </p>
      <p>© ${new Date().getFullYear()} imzodev. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Weekly digest email template
 */
export function weeklyDigestTemplate(
  data: EmailTemplateData & { 
    videos?: Array<{ title: string; url: string }>;
    posts?: Array<{ title: string; url: string }>;
    snippets?: Array<{ title: string; url: string }>;
  }
): string {
  const unsubscribeLink = data.unsubscribeLink || generateUnsubscribeLink(data.email, data.subscriberId, data.baseUrl);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Digest</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${data.baseUrl}" class="logo">imzodev</a>
    </div>
    <div class="content">
      <h1 class="title">${data.title || 'Weekly Digest'}</h1>
      <div class="body">
        ${data.content || ''}
        
        ${data.videos && data.videos.length > 0 ? `
          <div class="divider"></div>
          <h2 style="font-size: 20px; margin-bottom: 16px;">🎬 Latest Videos</h2>
          <ul style="list-style: none; padding: 0;">
            ${data.videos.map(v => `
              <li style="margin-bottom: 12px;">
                <a href="${v.url}" style="color: #667eea; text-decoration: none;">${v.title}</a>
              </li>
            `).join('')}
          </ul>
        ` : ''}
        
        ${data.posts && data.posts.length > 0 ? `
          <div class="divider"></div>
          <h2 style="font-size: 20px; margin-bottom: 16px;">📝 Blog Posts</h2>
          <ul style="list-style: none; padding: 0;">
            ${data.posts.map(p => `
              <li style="margin-bottom: 12px;">
                <a href="${p.url}" style="color: #667eea; text-decoration: none;">${p.title}</a>
              </li>
            `).join('')}
          </ul>
        ` : ''}
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${data.baseUrl}" class="button">View All Content</a>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>
        <a href="${data.baseUrl}">Visit Website</a> · 
        <a href="${unsubscribeLink}">Unsubscribe</a>
      </p>
      <p>© ${new Date().getFullYear()} imzodev. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * New video announcement template
 */
export function newVideoTemplate(
  data: EmailTemplateData & {
    videoTitle: string;
    videoUrl: string;
    thumbnail?: string;
    description?: string;
  }
): string {
  const unsubscribeLink = data.unsubscribeLink || generateUnsubscribeLink(data.email, data.subscriberId, data.baseUrl);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Video: ${data.videoTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${data.baseUrl}" class="logo">imzodev</a>
    </div>
    <div class="content">
      <h1 class="title">🎬 New Video!</h1>
      <div class="body">
        <h2 style="font-size: 22px; margin-bottom: 16px;">${data.videoTitle}</h2>
        ${data.thumbnail ? `<img src="${data.thumbnail}" alt="${data.videoTitle}" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">` : ''}
        ${data.description ? `<p>${data.description}</p>` : ''}
        <div style="text-align: center; margin-top: 30px;">
          <a href="${data.videoUrl}" class="button">Watch Now</a>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>
        <a href="${data.baseUrl}">Visit Website</a> · 
        <a href="${unsubscribeLink}">Unsubscribe</a>
      </p>
      <p>© ${new Date().getFullYear()} imzodev. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generic announcement template
 */
export function announcementTemplate(
  data: EmailTemplateData & {
    announcementTitle: string;
    announcementContent: string;
    ctaText?: string;
    ctaUrl?: string;
  }
): string {
  const unsubscribeLink = data.unsubscribeLink || generateUnsubscribeLink(data.email, data.subscriberId, data.baseUrl);
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.announcementTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${data.baseUrl}" class="logo">imzodev</a>
    </div>
    <div class="content">
      <h1 class="title">${data.announcementTitle}</h1>
      <div class="body">
        ${data.announcementContent}
        ${data.ctaText && data.ctaUrl ? `
          <div style="text-align: center; margin-top: 30px;">
            <a href="${data.ctaUrl}" class="button">${data.ctaText}</a>
          </div>
        ` : ''}
      </div>
    </div>
    <div class="footer">
      <p>
        <a href="${data.baseUrl}">Visit Website</a> · 
        <a href="${unsubscribeLink}">Unsubscribe</a>
      </p>
      <p>© ${new Date().getFullYear()} imzodev. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper to create welcome email
 */
export function createWelcomeEmail(
  email: string,
  subscriberId: number,
  baseUrl: string
): { html: string; subject: string } {
  return {
    html: welcomeEmailTemplate({ email, subscriberId, baseUrl }),
    subject: 'Welcome to the imzodev Newsletter!',
  };
}

/**
 * Helper to create new video email
 */
export function createNewVideoEmail(
  email: string,
  subscriberId: number,
  baseUrl: string,
  videoTitle: string,
  videoUrl: string,
  thumbnail?: string,
  description?: string
): { html: string; subject: string } {
  return {
    html: newVideoTemplate({ 
      email, 
      subscriberId, 
      baseUrl, 
      videoTitle, 
      videoUrl, 
      thumbnail, 
      description 
    }),
    subject: `🎬 New Video: ${videoTitle}`,
  };
}

/**
 * Helper to create weekly digest email
 */
export function createWeeklyDigestEmail(
  email: string,
  subscriberId: number,
  baseUrl: string,
  title: string,
  content: string,
  videos?: Array<{ title: string; url: string }>,
  posts?: Array<{ title: string; url: string }>
): { html: string; subject: string } {
  return {
    html: weeklyDigestTemplate({ 
      email, 
      subscriberId, 
      baseUrl, 
      title, 
      content,
      videos,
      posts
    }),
    subject: title,
  };
}
