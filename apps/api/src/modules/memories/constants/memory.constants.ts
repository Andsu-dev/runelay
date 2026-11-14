export const MEMORY_LIST_COLUMNS = `m.slug, m.name, m.description, m.type, m.pinned, m.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM memory_links l WHERE l.organization_id = m.organization_id AND l.from_slug = m.slug) AS linkCount,
  (SELECT COUNT(*) FROM memory_links l WHERE l.organization_id = m.organization_id AND l.to_slug = m.slug) AS backlinkCount`;

export const MEMORY_REF_COLUMNS = "m.slug, m.name, m.updated_at AS updatedAt";
