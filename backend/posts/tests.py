from django.test import TestCase
from django.contrib.auth import get_user_model
from .models import Post
from topics.models import Topic

User = get_user_model()


class PostModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.topic = Topic.objects.create(title="テストトピック", description="テスト説明")

    def test_post_creation_with_valid_content(self):
        """有効な投稿内容で投稿作成テスト"""
        post = Post.objects.create(
            content="これは有効な投稿内容です。",
            author=self.user,
            topic=self.topic
        )
        self.assertEqual(post.content, "これは有効な投稿内容です。")
        self.assertEqual(post.author, self.user)
        self.assertEqual(post.topic, self.topic)

    def test_post_creation_with_max_length_content(self):
        """最大文字数（500文字）で投稿作成テスト"""
        max_content = "あ" * 500
        post = Post.objects.create(
            content=max_content,
            author=self.user,
            topic=self.topic
        )
        self.assertEqual(len(post.content), 500)
        self.assertEqual(post.content, max_content)

    def test_post_creation_with_empty_content(self):
        """空の投稿内容で投稿作成テスト"""
        post = Post.objects.create(
            content="",
            author=self.user,
            topic=self.topic
        )
        self.assertEqual(post.content, "")

    def test_post_str_representation(self):
        """投稿の文字列表現テスト"""
        post = Post.objects.create(
            content="テスト投稿",
            author=self.user,
            topic=self.topic
        )
        self.assertEqual(str(post), f"Post ID: {post.id}")
