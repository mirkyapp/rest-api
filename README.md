# Mirky API

---

<aside>
👉 api.mirky.app

</aside>

---

## Endpoints

```
GET /v1/

{
	"message":"poop"
}
```

### Auth Routes

```
POST /v1/auth/annonSession

{
	"sessionId":string
}
```

```
POST /v1/auth/signup

{
	"message":"User created, session replaced",
	"sessionId":string
}
```

```
POST /v1/auth/login

{
	"message":"User logged in, session replaced",
	"sessionId":string
}
```

### Property Routes

```
POST /v1/property/create

{
	"message":"Property created",
	"property": {
		"propUid":string,
		"propName":string,
		"comapnyName":string,
		"website":string,
		"industry":string,
		"companySize":string,
		"createdAt":Date,
		"updatedAt":Date
	}
}
		
```

```
POST /v1/property/fetch-users-props

{
	"properties":Array
}
```