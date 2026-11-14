export const SKILL_LIST_COLUMNS = `s.slug, s.name, s.description, s.enabled, s.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM skill_files f WHERE f.organization_id = s.organization_id AND f.skill_slug = s.slug) AS fileCount`;
