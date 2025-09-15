from ninja import Schema
from typing import Optional

class ReportIn(Schema):
	reason: str

class UserOut(Schema):
	id: int
	username: str

class ReportOut(Schema):
	id: int
	reporter: UserOut
	reason: str
	content_type_id: int
	object_id: int
	created_at: str
