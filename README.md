# Filipino Cookbook Client Application

A web-based client application that consumes the **Filipino Cookbook API** to display traditional Filipino dishes, ingredients, categories, and recipes in a designed user interface.

---

## Table of Contents

1. [Application Title](#application-title)
2. [Application Description](#application-description)
3. [Technologies Used](#technologies-used)
4. [Project Structure](#project-structure)
5. [Installation Instructions](#installation-instructions)
6. [API Endpoints Used](#api-endpoints-used)
7. [Security Features](#security-features)
8. [Screenshots](#screenshots)
9. [API Source and Acknowledgment](#api-source-and-acknowledgment)
10. [Developer Information](#developer-information)

---

## Application Title

**Filipino Cookbook**

---

## Application Description

The **Filipino Cookbook Client Application** is a single-page web application that acts as a driver/client for the Filipino Cookbook API. It retrieves and presents authentic Filipino food data through an elegant, dark-themed user interface.

- **Purpose:** Provide a visual, user-friendly interface for browsing Filipino food data served by the API.
- **API Used:** Filipino Cookbook API by Freddierick Emil G. Ordono
- **Major Features:**
  - Browse all Filipino dishes in a responsive card grid
  - Filter dishes by food category (Main Dish, Soup, Dessert, etc.)
  - Search for dishes by name using a real-time search input
  - View full recipe details including ingredients and cooking instructions in a modal dialog
  - Animated live statistics (total dishes, categories, ingredients)
- **Intended Users:** Students and developers evaluating the API, or anyone interested in exploring Filipino cuisine.

---

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML5 | Application structure and markup |
| CSS3 (Vanilla) | Styling, animations, responsive layout |
| JavaScript (ES6+) | API calls, DOM manipulation, routing |
| Fetch API | HTTP requests to the Filipino Cookbook API |
| Google Fonts (Playfair Display + Inter) | Typography |
| Git & GitHub | Version control and repository hosting |

---

## Project Structure

```
filipino-cookbook-client-rimando/
├── index.html             # Main application entry point
├── README.md              # This file
├── css/
│   └── style.css          # Styles — dark theme, animations, responsive
├── js/
│   ├── app.js             # Application logic — fetch, render, navigation
│   └── config.js          # API base URL and token configuration
├── images/                # Dish and UI images
├── screenshots/           # UI screenshots
└── .gitignore             # Ignores OS and editor files
```

---

## Installation Instructions

### Prerequisites

- A running instance of the [Filipino Cookbook API](https://github.com/ordonofreddierick-bot/filipino-cookbook-api-ordono)
- XAMPP (Apache) or any local web server
- A modern web browser (Chrome, Firefox, Edge)

### Step 1 Clone the Repository

```bash
git clone https://github.com/johnlouierimando/filipino-cookbook-client-rimando.git
cd filipino-cookbook-client-rimando
```

### Step 2 Place in XAMPP Directory

Copy or move the project into your XAMPP htdocs folder:

```
C:\xampp\htdocs\filipino-cookbook-client-rimando\
```

### Step 3 Set Up the API First

Make sure the Filipino Cookbook API is installed and running. Follow the installation instructions at:

https://github.com/ordonofreddierick-bot/filipino-cookbook-api-ordono

The API must be accessible at:
```
http://localhost/filipino-cookbook-api-ordono/public
```

### Step 4 Configure the API Connection

Open `js/config.js` and verify the base URL and token match your installed API:

```javascript
const API_CONFIG = {
  baseUrl: 'http://localhost/filipino-cookbook-api-ordono/public',
  token:   'dmmmsu-cookbook-token-2026',
  headers: {
    'Authorization': 'Bearer dmmmsu-cookbook-token-2026',
    'Accept':        'application/json',
    'Content-Type':  'application/json'
  }
};
```

### Step 5 Start Apache in XAMPP

Open the XAMPP Control Panel and start **Apache**.

### Step 6 Open the Application

Navigate to:

```
http://localhost/filipino-cookbook-client-rimando/
```

The application will load and automatically fetch data from the API.

---

## API Endpoints Used

All requests include the `Authorization: Bearer dmmmsu-cookbook-token-2026` header.

| Method | Endpoint | Description | Used In |
|---|---|---|---|
| GET | `/api/foods` | Retrieve all Filipino foods with ingredients | All Dishes page, Stats bar |
| GET | `/api/foods/{id}` | Retrieve full details of a food by ID | Food detail modal |
| GET | `/api/foods/search/{name}` | Search foods by partial name match | Search page |
| GET | `/api/categories` | Retrieve all food categories | Category filter, Categories page |
| GET | `/api/ingredients` | Retrieve all ingredients | Stats bar (ingredient count) |
| POST | `/api/foods` | Add a new food record | Stats bar (ingredient count) |

---

## Security Features

### Per-IP Rate Limiting (API-Side)

The **Filipino Cookbook API** this client consumes implements a **Per-IP Rate Limiter** on all `/api/*` routes.

| Setting | Value |
|---|---|
| Algorithm | Sliding window |
| Max requests | 10 per IP |
| Time window | 30 seconds |
| Response when exceeded | `429 Too Many Requests` |

**Client-side pre-check:** The client also tracks requests locally in JavaScript and shows the popup **before** the API call is even made — preventing unnecessary network requests.

**How the client handles rate limiting:**

When the rate limit is hit, the client displays a polished popup modal with a live countdown timer:

```
⏳ Rate limit reached — too many requests. Please wait 30 seconds and try again.
```

This is handled in `js/app.js` via `checkRateLimit()` (client-side) and `apiFetch()` (API-side 429 fallback), which reads the `Retry-After` header to display the exact wait time.

---

## Screenshots

### Home
![Home showing the Filipino Cookbook landing page with title and call-to-action buttons](screenshots/home.png)

---

### Home (Alternate View)
![Alternate home view showing a second layout or UI state](screenshots/home2.png)

---

### All Dishes Food Grid with Category Filter
![All Dishes page showing food cards with actual dish photos and category filter pills](screenshots/all_dishes.png)

---

### All Dishes (Alternate View)
![Second all dishes view showing additional food cards and filters](screenshots/all_dishes2.png)

---

### Categories Browse by Category
![Categories page showing category cards with representative dish photos](screenshots/categories.png)

---

### Search Dishes by Name
![Search page showing search input and filtered results](screenshots/search_food.png)

---

### Dish Ingredients
![Ingredients and recipe detail modal showing dish photo, ingredients list, and instructions](screenshots/INGREDIENTS.png)

---

### Add Dish Modal
![Add dish view showing the recipe submission form](screenshots/add_dish.png)

---

### Add Dish Confirmation / Success
![Add dish confirmation view showing a completed dish submission or success state](screenshots/add_dish2.png)

---

### Add Dish Example: Chopsuey
![Add dish example screenshot showing the Chopsuey recipe entry form](screenshots/add_dish_chopsuey.png)

---

### Rate Limiter Too Many Requests Popup
![Rate limit popup modal with countdown timer shown in the browser](screenshots/rate_limiting.png)

---

## API Source and Acknowledgment

This client application uses the Filipino Cookbook API developed by:

**Developer:** Freddierick Emil G. Ordoño

**GitHub Repository:** https://github.com/ordonofreddierick-bot/filipino-cookbook-api-ordono

The API is used for educational purposes with the permission of the developer.

---

## Developer Information

| Field | Details |
|---|---|
| Student Name | John Louie Rimando |
| Course & Section | BS Information Technology 4-A |
| GitHub Username | johnlouierimando |
| Repository Link | https://github.com/johnlouierimando/filipino-cookbook-client-rimando |
| Date Completed | July 2026 |

---