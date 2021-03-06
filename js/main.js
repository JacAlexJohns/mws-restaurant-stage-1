let restaurants,
  neighborhoods,
  cuisines
var dbPromise
var mapUrl
var markers = []
var key = 'AIzaSyCUt97AVyhtqjH1RVjLkrWYAbIKPzl2qU4'

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  addMap();
  registerServiceWorker();
  openDatabase();
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurantsCached();
});

registerServiceWorker = () => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js').then(function() {
      console.log('Registration worked!');
    }).catch(function(error) {
      console.log('Registration failed!',error);
    });
  }
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
addMap = () => {
  let mapUrl = 'https://maps.googleapis.com/maps/api/staticmap?';
  let loc = '40.722216,-73.987501';
  let zoom = '12';
  let size = {
    width: window.innerWidth || document.body.clientWidth,
    height: 400
  }
  mapUrl += 'center=' + loc + '&zoom=' + zoom + '&size=' + size.width + 'x' + size.height + '&';
  self.mapUrl = mapUrl;
  mapUrl += 'key=' + self.key;
  let mapContainer = document.getElementById('map-container');
  let image = document.createElement('img');
  image.src = mapUrl;
  image.alt = 'Map of Restaurant Locations';
  image.id = 'map';
  mapContainer.append(image);
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      console.log(restaurants)
      this.dbPromise.then(function(db) {
        if (!db) return;
        var tx = db.transaction('restaurants', 'readwrite');
        var store = tx.objectStore('restaurants');
        restaurants.forEach(function(restaurant) {
          store.put(restaurant);
        });
      });
      resetRestaurants(restaurants);
      fillRestaurantsHTML(true);
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (toAddMarkers, restaurants = self.restaurants) => {
  const tabIndex = 0;
  const ul = document.getElementById('restaurants-list');
  if (restaurants.length === 0) {
    ul.setAttribute('tabIndex', tabIndex.toString());
    ul.setAttribute('role', 'contentinfo');
    ul.setAttribute('aria-label', 'No restaurants displayed, please adjust your filter options');
  }
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant, tabIndex));
  });
  if (toAddMarkers) addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, tabIndex) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
  image.alt = restaurant.name + ' Image';
  li.append(image);

  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('tabIndex', tabIndex.toString());
  more.setAttribute('aria-label', 'View Details for restaurant ' + restaurant.name);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  const favorite = document.createElement('img');
  favorite.className = 'favorite-img';
  console.log(restaurant)
  console.log(restaurant.is_favorite)
  if (restaurant.is_favorite == 'true') {
    const star = DBHelper.starImageUrlForRestaurant(restaurant);
    favorite.setAttribute('data-src', star);
    favorite.setAttribute('toFavorite', true);
    favorite.alt = 'Favorite Icon, Marked to Favorite';
    console.log('A');
    console.log(star);
    favorite.src = star;
  } else {
    const star = DBHelper.unstarImageUrlForRestaurant(restaurant);
    favorite.setAttribute('data-src', star);
    favorite.setAttribute('toFavorite', false);
    favorite.alt = 'Favorite Icon, Not Marked to Favorite';
    console.log('B');
    console.log(star);
    favorite.src = star;
  }
  favorite.onclick = () => {
    const toStar = favorite.getAttribute('toFavorite');
    const star = DBHelper.updateStarImageForRestaurant(restaurant, toStar);
    if (toStar == 'true') {
      favorite.setAttribute('toFavorite', false);
      favorite.alt = 'Favorite Icon, Not Marked to Favorite';
    } else {
      favorite.setAttribute('toFavorite', true);
      favorite.alt = 'Favorite Icon, Marked to Favorite';
    }
    favorite.setAttribute('data-src', star);
    favorite.src = star;
  }
  li.append(favorite);

  return li
}

toggleFavorite = (favorite, restaurant) => {
  if (favorite.getAttribute('toFavorite')) {
    favorite.setAttribute('data-src', DBHelper.unstarImageUrlForRestaurant(restaurant));
    favorite.setAttribute('toFavorite', false);
    favorite.alt = 'Favorite Icon, Not Marked to Favorite';
  } else {
    favorite.setAttribute('data-src', DBHelper.starImageUrlForRestaurant(restaurant));
    favorite.setAttribute('toFavorite', true);
    favorite.alt = 'Favorite Icon, Marked to Favorite';
  }
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  let image = document.getElementById('map');
  let markers = ''
  restaurants.forEach(restaurant => {
    const latlng = restaurant.latlng;
    markers += 'markers=' + latlng.lat + ',' + latlng.lng + '&'
  });
  let url = self.mapUrl
  url += markers + 'key=' + self.key;
  image.src = url;
}

openDatabase = () => {
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }
  this.dbPromise = idb.open('restaurant', 1);
}

showCachedMessages = () => {
  return this.dbPromise.then(function(db) {
    if (!db || document.getElementById('restaurants-list').getElementsByTagName('li') > 0) return;
    var os = db.transaction('restaurants').objectStore('restaurants');
    return os.getAll().then(function(restaurants) {
      resetRestaurants(restaurants);
      fillRestaurantsHTML(false);
    });
  });
}

updateRestaurantsCached = () => {
  showCachedMessages().then(function() {
    updateRestaurants();
  });
}
