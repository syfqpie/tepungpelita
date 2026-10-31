import type { CollectionAccess } from '@directus/types'

/** The EXIF entry is for admins and for roles that can read `exif_metadata` (fully or with a filter). */
export const canSeeModule = (user: { admin_access?: boolean | null }, permissions: Partial<CollectionAccess>): boolean =>
	user.admin_access === true || (permissions.exif_metadata?.read?.access ?? 'none') !== 'none'
