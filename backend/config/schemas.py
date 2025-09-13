from ninja import Schema


class ErrorOut(Schema):
    """
    シンプルなエラーメッセージレスポンス用スキーマ
    """

    message: str