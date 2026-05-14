const PROJECT_PREFIX = 'smart_home_designs_project_'

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
        if(!project?.id || !project?.sourceImage) return jsonError(400, 'Project not found')
        const payload = {
            ...project,
            updatedAt: new Date().toISOString(),
        }
        const userId = await getUserId(userPuter)
        if(!userId) return jsonError(401, 'Unauthorized')
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
                return value ? { ...value, isPublic: true } : null
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

        return { project }
    } catch (e) {
        return jsonError(500, 'Failed to get project', { message: e.message || 'Unknown error' })
    }
})