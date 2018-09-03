let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

window.addEventListener("load", function () {
  const form = document.getElementById("review-add");

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    addReview();
  });

  addReview = () => {
    const id = getParameterByName('id');
    const name = document.getElementById("name-input");
    const rating = document.getElementById("rating-input");
    const review = document.getElementById("review-input");
    form.style.visibility = "hidden";
    const url = "http://localhost:1337/reviews/";
    const data = {
      "restaurant_id": parseInt(id),
      "name": name.value,
      "rating": rating.value,
      "comments": review.value
    };
    DBHelper.postData(url, data).then(json => {
        window.location.reload();
    });
  }
});

addReviewDialog = () => {
  const form = document.getElementById("review-add");
  form.style.visibility = "visible";
}

dismissReviewDialog = () => {
  const form = document.getElementById("review-add");
  form.style.visibility = "hidden";
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    getCachedRestaurant(id).then(function(restaurant) {
      self.restaurant = restaurant;
    });
    if (self.restaurant) {
      fillRestaurantHTML();
      callback(null, self.restaurant);
      return;
    }
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const tabIndex = 0;

  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  name.setAttribute('tabIndex', tabIndex.toString());

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name + ' Image';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant))

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  getAndFillReviews(self.restaurant.id);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

getAndFillReviews = (id) => {
  const reviewsUrl = `http://localhost:1337/reviews/?restaurant_id=${id}`;
  fetch(reviewsUrl).then(response => response.json()).then(json => {
    self.restaurant.reviews = json;
    fillReviewsHTML();
  });
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const tabIndex = 0;

  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  title.setAttribute("tabIndex", tabIndex.toString());
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  let d = new Date(review.createdAt);
  if (!d) d = '';
  date.innerHTML = (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute("id", "comments")
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

getCachedRestaurant = (id) => {
  return getDatabase().then(function(db) {
    if (!db) return;
    var os = db.transaction('restaurants').objectStore('restaurants');
    return os.get(parseInt(id)).then(function(restaurant) {
      console.log("Restaurant", restaurant);
      return restaurant;
    });
  });
}

getDatabase = () => {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  return dbPromise = idb.open('restaurant', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('restaurants', {
      keyPath: 'id'
    });
    var markerStore = upgradeDb.createObjectStore('markers', {
      keyPath: 'title'
    });
  });
}
