const PROJECT_PREFIX = 'smart_home_designs_project_'

const ALLOWED_STYLES = ['Modern', 'Minimal', 'Scandinavian', 'Industrial', 'Classic', 'Bohemian']

const sanitizeStyle = (style) => {
    if (typeof style !== 'string') return null
    const trimmed = style.trim()
    return ALLOWED_STYLES.includes(trimmed) ? trimmed : null
}

const isAllowedSourceUrl = (url) => {
    if (typeof url !== 'string' || !url) return false
    try {
        const hostname = new URL(url).hostname
        return hostname === 'puter.site' || hostname.endsWith('.puter.site')
    } catch {
        return false
    }
}

const jsonError = (status, message, extra) => {
    return new Response(JSON.stringify({status, message, ...extra}), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    })
};

const getUserId = async  (userPuter) => {
    try {
        const user = await userPuter.auth.getUser();
        return user.uuid || null
    } catch {return  null}
}



router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter
        if(!userPuter) return jsonError(401, 'Unauthorized')
        const body = await request.json()
        const project = body?.project
        const { visibility } = body ?? {}
        const incomingVisibility = visibility ?? project?.visibility
        const hasIncomingVisibility = typeof incomingVisibility !== 'undefined' && incomingVisibility !== null
        if (hasIncomingVisibility && incomingVisibility !== 'public' && incomingVisibility !== 'private') {
            return jsonError(400, 'Invalid visibility value')
        }
        const validatedVisibility = hasIncomingVisibility ? incomingVisibility : null
        if(!project?.id || !project?.sourceImage) return jsonError(400, 'Missing required fields: id, sourceImage')
        if (!isAllowedSourceUrl(project.sourceImage)) {
            return jsonError(400, 'Invalid source image URL')
        }
        const userId = await getUserId(userPuter)
        if(!userId) return jsonError(401, 'Unauthorized')
        const payload = {
            ...project,
            ownerId: userId,
            selectedStyle: sanitizeStyle(project.selectedStyle),
            visibility: validatedVisibility ?? (project.isPublic ? 'public' : 'private'),
            isPublic: validatedVisibility
                ? (validatedVisibility === 'public')
                : (typeof project.isPublic === 'boolean' ? project.isPublic : false),
            updatedAt: new Date().toISOString(),
        }
        if (payload.renderedImage && !isAllowedSourceUrl(payload.renderedImage)) {
            delete payload.renderedImage
        }
        const key = `${PROJECT_PREFIX}${project.id}`
        await userPuter.kv.set(key, payload)
        return { saved: true, id: project.id, project: payload}
    } catch (e) {
      return jsonError(500, 'Failed to save project', {message: e.message || 'Unknown error'})
    }
});

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user?.puter
        if (!userPuter) return jsonError(401, 'Unauthorized')

        const userId = await getUserId(userPuter)
        if (!userId) return jsonError(401, 'Unauthorized')

        const keys = await userPuter.kv.list()
        const projectKeys = keys.filter((key) => key.startsWith(PROJECT_PREFIX))

        const projects = (await Promise.all(
            projectKeys.map(async (key) => {
                const value = await userPuter.kv.get(key)
                if (!value) return null

                const resolvedIsPublic = typeof value.isPublic === 'boolean'
                    ? value.isPublic
                    : (value.visibility === 'public')

                return { ...value, isPublic: resolvedIsPublic }
            })
        )).filter(Boolean)

        return { projects }
    } catch (e) {
        return jsonError(500, 'Failed to list projects', { message: e.message || 'Unknown error' })
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user?.puter
        if (!userPuter) return jsonError(401, 'Unauthorized')

        const userId = await getUserId(userPuter)
        if (!userId) return jsonError(401, 'Unauthorized')

        const url = new URL(request.url)
        const id = url.searchParams.get('id')
        if (!id) return jsonError(400, 'Missing project id')

        const key = `${PROJECT_PREFIX}${id}`
        const project = await userPuter.kv.get(key)
        if (!project) return jsonError(404, 'Project not found')
        if (project.ownerId && project.ownerId !== userId) {
            return jsonError(403, 'Forbidden')
        }

        return {
            project: {
                ...project,
                selectedStyle: sanitizeStyle(project.selectedStyle),
            },
        }
    } catch (e) {
        return jsonError(500, 'Failed to get project', { message: e.message || 'Unknown error' })
    }
})