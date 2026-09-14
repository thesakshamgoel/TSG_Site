/**
 * STORE — the single source of truth the whole app reads through.
 *
 * It merges the shipped SEED data with "edits" that live either in Firestore
 * (when Firebase is configured — shared across all visitors) or in this
 * browser's localStorage (the zero-config fallback). Same merge, same exported
 * function names either way; only the persistence layer swaps underneath.
 *
 * Edits shape (Firestore doc `site/content`, or localStorage key below):
 *   {
 *     projectsAdded:   [ ...project ],
 *     projectsHidden:  [ id, ... ],
 *     projectOverrides:{ [id]: patch },
 *     profile:         patch | null,
 *     comparisons:     [ ...pair ] | null,   // Before/After slider
 *     reviewsAdded:    [ ...review ],        // reviews you've added
 *     displayReviewIds:[ id, id, id ] | null,// the 3 reviews shown on the site
 *     featuredWorkIds: [ id, id, id ] | null,// the 3 featured works
 *   }
 */
import { useSyncExternalStore } from 'react'
import {
  PROJECTS as SEED_PROJECTS,
  PROFILE as SEED_PROFILE,
  CATEGORIES,
  CERTIFICATES,
  EXPERIENCES,
  REVIEWS as SEED_REVIEWS,
  STILLS,
  COMPARISONS as SEED_COMPARISONS,
} from './seed'
import { firebaseEnabled } from '../firebase/config'
import { subscribeContent, saveContent } from '../firebase/content'

const KEY = 'sg_portfolio_v1'

const emptyLocal = {
  projectsAdded: [],
  projectsHidden: [],
  projectOverrides: {},
  profile: null,
  comparisons: null,
  reviewsAdded: [],
  displayReviewIds: null,
  featuredWorkIds: null,
}

// ── local (fallback) persistence ───────────────────────────────────────────
function readLocal() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...emptyLocal }
    return { ...emptyLocal, ...JSON.parse(raw) }
  } catch {
    return { ...emptyLocal }
  }
}

function writeLocal(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
  emitChange()
}

// ── external store plumbing ────────────────────────────────────────────────
const listeners = new Set()
let version = 0
function emitChange() {
  version++
  listeners.forEach((l) => l())
}
function subscribe(listener) {
  listeners.add(listener)
  const onStorage = (e) => {
    if (e.key === KEY) emitChange()
  }
  if (!firebaseEnabled) window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    if (!firebaseEnabled) window.removeEventListener('storage', onStorage)
  }
}

// remote (Firestore) edits, kept in sync via a live subscription
let remoteData = firebaseEnabled ? null : undefined
if (firebaseEnabled) {
  subscribeContent((data) => {
    remoteData = data || {}
    emitChange()
  })
}

/** The current edits object, from whichever backend is active. */
function currentEdits() {
  const base = firebaseEnabled ? remoteData || {} : readLocal()
  return { ...emptyLocal, ...base }
}

// cache the derived snapshot so useSyncExternalStore gets a stable reference
let cache = null
let cacheVersion = -1
function getSnapshot() {
  if (cache && cacheVersion === version) return cache
  cacheVersion = version
  cache = buildSnapshot(currentEdits())
  return cache
}

// ── merge seed + edits into what the UI renders ────────────────────────────
function pickByIds(items, ids, max, keyOf) {
  if (Array.isArray(ids) && ids.length) {
    const map = new Map(items.map((i) => [keyOf(i), i]))
    const chosen = ids.map((id) => map.get(id)).filter(Boolean)
    if (chosen.length) return chosen.slice(0, max)
  }
  return null
}

function buildSnapshot(local) {
  const overrides = local.projectOverrides || {}
  const hidden = new Set(local.projectsHidden || [])
  const merged = SEED_PROJECTS.filter((p) => !hidden.has(p.id)).map((p) =>
    overrides[p.id] ? { ...p, ...overrides[p.id] } : p
  )
  const projects = [...merged, ...(local.projectsAdded || [])]

  const profile = local.profile ? { ...SEED_PROFILE, ...local.profile } : SEED_PROFILE
  const comparisons = Array.isArray(local.comparisons) ? local.comparisons : SEED_COMPARISONS

  const reviews = [
    ...SEED_REVIEWS,
    ...(local.reviewsAdded || []).map((r) => ({ ...r, _added: true })),
  ]
  const displayReviews =
    pickByIds(reviews, local.displayReviewIds, 3, (r) => r.id) || reviews.slice(0, 3)

  const featuredProjects =
    pickByIds(projects, local.featuredWorkIds, 3, (p) => p.id) || defaultFeatured(projects)

  return {
    projects,
    profile,
    categories: CATEGORIES,
    certificates: CERTIFICATES,
    experiences: EXPERIENCES,
    reviews, // full pool (for the console)
    displayReviews, // the 3 shown on the site
    featuredProjects, // the 3 featured works
    comparisons,
    stills: STILLS,
    displayReviewIds: local.displayReviewIds || null,
    featuredWorkIds: local.featuredWorkIds || null,
  }
}

function defaultFeatured(projects) {
  const flagged = projects.filter((p) => p.highlight)
  const pool = flagged.length ? flagged : projects.filter((p) => p.mediaType !== 'image')
  return pool.slice(0, 3)
}

/** React hook — read the merged portfolio, re-renders on any change. */
export function usePortfolio() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function projectsByCategory(projects, categoryId) {
  const items = projects.filter((p) => p.category === categoryId)
  return items.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))
}

/** Up to 3 featured works for the home slideshow (honours the console picks). */
export function highlightProjects(projects) {
  return defaultFeatured(projects)
}

export function groupBySubcategory(projects, category) {
  const items = projectsByCategory(projects, category.id)
  const subcats = category.subcats || []
  const groups = subcats.map((sc) => ({
    ...sc,
    items: items.filter((p) => p.subcategory === sc.id),
  }))
  const known = new Set(subcats.map((s) => s.id))
  const rest = items.filter((p) => !known.has(p.subcategory))
  if (rest.length) groups.push({ id: 'other', label: 'More', items: rest })
  return groups
}

// ── mutations (write to Firestore when on, else localStorage) ───────────────
function applyEdit(updater) {
  const next = updater(currentEdits())
  if (firebaseEnabled) {
    remoteData = next // optimistic; the onSnapshot will reconcile
    emitChange()
    saveContent(next).catch((e) => console.warn('[firebase] save failed:', e?.message))
  } else {
    writeLocal(next)
  }
}

export function addProject(project) {
  applyEdit((local) => {
    const id = project.id || `user-${slug(project.title)}-${shortRand(project)}`
    return {
      ...local,
      projectsAdded: [...(local.projectsAdded || []), { ...project, id, _userAdded: true }],
    }
  })
}

export function updateProject(id, patch) {
  applyEdit((local) => {
    if ((local.projectsAdded || []).some((p) => p.id === id)) {
      return {
        ...local,
        projectsAdded: local.projectsAdded.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }
    }
    return {
      ...local,
      projectOverrides: {
        ...local.projectOverrides,
        [id]: { ...(local.projectOverrides?.[id] || {}), ...patch },
      },
    }
  })
}

export function deleteProject(id) {
  applyEdit((local) => {
    if ((local.projectsAdded || []).some((p) => p.id === id)) {
      return { ...local, projectsAdded: local.projectsAdded.filter((p) => p.id !== id) }
    }
    const nextOverrides = { ...local.projectOverrides }
    delete nextOverrides[id]
    return {
      ...local,
      projectsHidden: [...new Set([...(local.projectsHidden || []), id])],
      projectOverrides: nextOverrides,
    }
  })
}

export function updateProfile(patch) {
  applyEdit((local) => ({ ...local, profile: { ...(local.profile || {}), ...patch } }))
}

export function setComparisons(list) {
  applyEdit((local) => ({
    ...local,
    comparisons: Array.isArray(list) ? list.slice(0, 6) : null,
  }))
}

/** Add a review to the pool (e.g. from a form submission you liked). */
export function addReview(review) {
  applyEdit((local) => {
    const id = review.id || `rev-user-${shortRand(review)}`
    return { ...local, reviewsAdded: [...(local.reviewsAdded || []), { ...review, id }] }
  })
}

export function deleteReview(id) {
  applyEdit((local) => ({
    ...local,
    reviewsAdded: (local.reviewsAdded || []).filter((r) => r.id !== id),
    displayReviewIds: (local.displayReviewIds || []).filter((x) => x !== id),
  }))
}

/** Choose exactly the reviews shown on the site (max 3). */
export function setDisplayReviews(ids) {
  applyEdit((local) => ({
    ...local,
    displayReviewIds: Array.isArray(ids) && ids.length ? ids.slice(0, 3) : null,
  }))
}

/** Choose the featured works for the home slideshow (max 3). */
export function setFeaturedWorks(ids) {
  applyEdit((local) => ({
    ...local,
    featuredWorkIds: Array.isArray(ids) && ids.length ? ids.slice(0, 3) : null,
  }))
}

export function exportLocal() {
  return JSON.stringify(currentEdits(), null, 2)
}

export function importLocal(json) {
  const parsed = JSON.parse(json)
  applyEdit(() => ({ ...emptyLocal, ...parsed }))
}

export function resetLocal() {
  if (firebaseEnabled) {
    applyEdit(() => ({ ...emptyLocal }))
  } else {
    localStorage.removeItem(KEY)
    emitChange()
  }
}

// ── helpers ────────────────────────────────────────────────────────────────
export function parseYouTubeId(input) {
  if (!input) return ''
  const s = input.trim()
  if (/^[\w-]{11}$/.test(s) && !s.includes('/')) return s
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
  ]
  for (const re of patterns) {
    const m = s.match(re)
    if (m) return m[1]
  }
  return s
}

function slug(str = '') {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24)
}

function shortRand(seed) {
  const s = JSON.stringify(seed) + (typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) || '' : '') + version
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h.toString(36).slice(0, 5)
}
