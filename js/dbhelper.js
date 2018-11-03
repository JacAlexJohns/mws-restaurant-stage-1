const dBase = idb.open('restaurant', 1, function(upgradeDb) {
  var reviewStore = upgradeDb.createObjectStore('offlineReviews');
});
/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 8000; // Change this to your server port
    return `http://localhost:${port}/data/restaurants.json`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetch("http://localhost:1337/restaurants")
      .then(function(response) {
        return response.json();
      }).then(function(restaurants) {
        callback(null, restaurants);
      }).catch(function(err) {
        callback(err, null);
      });
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (restaurant.photograph === undefined) return `dist/img/10.jpg`;
    return (`dist/img/${restaurant.photograph}.jpg`);
  }

  static getStarImageForRestaurants(restaurant, callback) {
    fetch("http://localhost:1337/restaurants/?is_favorite=true")
      .then(function(response) {
        return response.json();
      }).then(function(favorites) {
        callback(null, favorites);
      }).catch(function(error) {
        callback(error, null);
      });
  }

  static updateStarImageForRestaurant(restaurant, toStar) {
    console.log(toStar);
    if (toStar == 'false') {
      fetch("http://localhost:1337/restaurants/" + restaurant.id + "/?is_favorite=true", {method : 'PUT'});
      return DBHelper.starImageUrlForRestaurant();
    } else {
      fetch("http://localhost:1337/restaurants/" + restaurant.id + "/?is_favorite=false", {method : 'PUT'});
      return DBHelper.unstarImageUrlForRestaurant();
    }
  }

  static starImageUrlForRestaurant() {
    return (`dist/img/star.png`)
  }

  static unstarImageUrlForRestaurant() {
    return (`dist/img/blank_star.png`)
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map, dbPromise) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    // dbPromise.then(function(db) {
    //   console.log("Hello");
    //   if (!db) return;
    //   var tx = db.transaction('markers', 'readwrite');
    //   var store = tx.objectStore('markers');
    //   store.put(marker);
    // });
    return marker;
  }

  static postData(url, data) {
    const headers = new Headers({'Content-Type': 'application/json'});
    return fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data)
    })
    .then(response => {
      console.log(response);
      return response.json();
    })
    .catch(error => {
      dBase.then(db => {
        const store = db.transaction('offlineReviews', 'readwrite').objectStore('offlineReviews');
        store.put(data, 'offlineReview').then(response => {
          navigator.serviceWorker.ready.then(registered => {
            return registered.sync.register('review');
          });
        })
      });
    });
  }

}
