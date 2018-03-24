// Global variables
var map, bounds, largeInfowindow, clientId, clientSecret;

// Google maps init
function initMap() {
    // Constructor creates a map
    map = new google.maps.Map(document.getElementById('map'),{
        center: {lat: 32.884580, lng: -96.920761},
        zoom: 20,
        styles: styles
    });
    largeInfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();

    ko.applyBindings(new ViewModel());
}

// Populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, street, city, URL, infowindow) {
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.addListener('closeclick', function(){
            infowindow.setMarker = null;
        });
        var windowContent = '<h4>' + marker.title + '</h4>' + 
            '<p>' + street + '<br>' + city + '</p>' + '<a href="'+ URL +'" target="blank">' + URL + '</a>';
        infowindow.setContent(windowContent);
        infowindow.open(map, marker);
    }
}

// BOUNCE animation for marker
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    }
    else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(function() {
        marker.setAnimation(null);
    }, 2100);
    }
}

// Google map error handling
googleError = function googleError() {
    alert(
        "Oops. Google Maps did not load. Please refresh the page and try again!"
    );
};

// Location model
var Location = function(data) {
    var self = this;
    self.title = data.title;
    self.position = data.location;
    // Create ko observable variable
    self.visible=ko.observable(true);
    // Foursquare API variables
    clientId = "UVZ4WJHDU3QSIHZ2SMGJSE2GZDJV1GF31H5NLWL532CQPQYF";
    clientSecret = "DD0AWZH35WO1KHCGQFE5ZVDJMUSBRGKU1GREAHVGHZ02ACZA";
    var foursquareURL = 'https://api.foursquare.com/v2/venues/search?ll='+ self.position.lat + ',' + self.position.lng + '&client_id=' + clientId + '&client_secret=' + clientSecret + '&v=20180324' + '&query=' + this.title;
    
    // Get JSON request of Foursquare
    $.getJSON(foursquareURL).done(function(data) {
        var response = data.response.venues[0] || "";
        self.street = response.location.formattedAddress[0] || "";
        self.city = response.location.formattedAddress[1] || "";
        self.URL = response.url || "";
    }).fail(function() {
        alert("Oops. Foursquare did not load. Please refresh the page and try again!");
    });

    // Create google marker
    self.marker = new google.maps.Marker({
        map: map,
        position: self.position,
        title: self.title,
        animation:google.maps.Animation.DROP
    });
    // Extend the boundaries of the map for each marker
    bounds.extend(self.position);
    map.fitBounds(bounds);
    // Bounce a marker and show its infowindow when click
    self.marker.addListener('click', function(){
        populateInfoWindow(this, self.street, self.city, self.URL, largeInfowindow);
        toggleBounce(this);
    });

    // Show visible markers on map
    self.showVisible = ko.computed(function() {
        self.marker.setVisible(self.visible());
    }, self);
};

// Bounce a marker and show its infowindow when click from the list
Location.prototype.show = function() {
    var self = this;
    google.maps.event.trigger(self.marker, 'click');
}

// ViewModel
var ViewModel = function() {
    var self = this;
    self.searchTerm = ko.observable('');
    self.markerList = ko.observableArray([]);

    // Add all markers
    locations.forEach(function(location){
        self.markerList.push(new Location(location));
    });

    // Filter markerList by search
    self.filteredList = ko.computed(function() {
        var filter = self.searchTerm().toLowerCase();
        if(filter) {
            return ko.utils.arrayFilter(self.markerList(),function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(filter);
                location.visible(result);
                return result;
            });
        }
        self.markerList().forEach(function(location) {
            location.visible(true);
        });
        return self.markerList();
    }, self);
};


// Toggle sidebar using jQuery
$(document).ready(function () {
    $('#sidebarCollapse').on('click', function() {
        $('#sidebar').toggleClass('active');
    });
});
