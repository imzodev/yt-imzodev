import type { ForumCategory } from '../../db/schema';
import type { Viewer } from './forum-types';

export function canModerate(viewer: Viewer) {
  return viewer?.role === 'moderator' || viewer?.role === 'admin';
}

export function canAccessCategory(category: Pick<ForumCategory, 'accessLevel'>, viewer: Viewer) {
  if (category.accessLevel === 'public') {
    return true;
  }

  if (!viewer || viewer.isActive === false) {
    return false;
  }

  if (category.accessLevel === 'member') {
    return true;
  }

  return viewer.subscriptionTier === 'premium' || viewer.subscriptionTier === 'lifetime' || canModerate(viewer);
}
