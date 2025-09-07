
from django.test import TestCase

class HealthCheckTest(TestCase):
    def test_health_check(self):
        response = self.client.get('/health/')
        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content, '{"status": "ok"}')
