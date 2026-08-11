def get_avatar_url(user, request=None):
    profile = getattr(user, 'account_profile', None)
    if not profile or not profile.avatar:
        return None
    url = profile.avatar.url
    if request is not None:
        return request.build_absolute_uri(url)
    return url
