-- Check community #41 data
SELECT 
    c.id,
    c.name,
    c."createdBy",
    c.status,
    c."isActive",
    COUNT(uc."userId") as total_members,
    COUNT(CASE WHEN uc."joinedViaCode" = true THEN 1 END) as joined_via_code,
    COUNT(CASE WHEN uc."joinedViaCode" = true AND uc."userId" != c."createdBy" THEN 1 END) as joined_via_code_excluding_creator
FROM public.communities c
LEFT JOIN public.users_on_communities uc ON c.id = uc."communityId"
WHERE c.id = 41
GROUP BY c.id, c.name, c."createdBy", c.status, c."isActive";

-- Show all members
SELECT 
    uc."userId",
    uc."communityId", 
    uc."joinedViaCode",
    uc."joinedAt",
    u."firstName",
    u."lastName"
FROM public.users_on_communities uc
LEFT JOIN public.users u ON uc."userId" = u.id
WHERE uc."communityId" = 41;

-- Show creator
SELECT 
    c.id,
    c."createdBy",
    u."firstName",
    u."lastName"
FROM public.communities c
LEFT JOIN public.users u ON c."createdBy" = u.id
WHERE c.id = 41;
