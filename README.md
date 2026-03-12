# Grocery-bud-rest

Simple Django REST API used by the Grocery Bud React frontend.

## Local dev

```powershell
.\venv\Scripts\python manage.py migrate
.\venv\Scripts\python manage.py runserver
```

API base: `http://127.0.0.1:8000/api/grocery/`

## Endpoints

- `GET /api/grocery/` list items
- `POST /api/grocery/` create item (`{"name":"Milk"}`)
- `GET /api/grocery/<id>/` retrieve item
- `PUT/PATCH /api/grocery/<id>/` update item
- `DELETE /api/grocery/<id>/` delete item
- `POST /api/grocery/<id>/toggle/` toggle `completed`
