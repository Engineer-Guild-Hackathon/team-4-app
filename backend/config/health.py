from django.http import JsonResponse
from django.db import connections, DatabaseError

def health(request):
    try:
        connections['default'].cursor()
        return JsonResponse({'status': 'ok'})
    except DatabaseError:
        return JsonResponse({'status': 'db error'}, status=500)
