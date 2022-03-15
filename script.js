'use strict';

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
class Visit {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  constructor(coords, type, place, from, to, note = '') {
    this.note = note;
    this.coords = coords;
    this.type = type;
    this.place = place;
    this.from = from;
    this.to = to;
    this._setDiscription();
  }
  _setDiscription() {
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

// APPLICATION ARCHITECTURE..........................................................
const form = document.querySelector('.form');
const containerVisits = document.querySelector('.visits');
const inputType = document.querySelector('.form__input--type');
const inputPlace = document.querySelector('.form__input--place');
const inputFrom = document.querySelector('.form__input--from');
const inputTo = document.querySelector('.form__input--to');
const inputNote = document.querySelector('.form__input--note');
// const resetBtn = document.querySelector('.reset');

class App {
  #map;
  #mapEvent;
  #visits = [];
  #mapZoomLevel = 15;

  constructor() {
    this._getPosition();
    //get visits from local storage
    this._getLocalStorage();
    //new visit
    form.addEventListener('submit', this._newVisit.bind(this));
    //toggle type
    inputType.addEventListener('change', this._toggleType);
    //move to popup location
    containerVisits.addEventListener('click', this._moveToPopup.bind(this));
  }
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Location not found');
        }
      );
    }
  }
  _loadMap(position) {
    // console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    console.log(latitude, longitude);

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    //handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    //render the markers
    this.#visits.forEach(visit => {
      this._renderVisitMarker(visit);
    });

    L.marker([latitude, longitude])
      .addTo(this.#map)
      .bindPopup('Current Location')
      .openPopup();
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputPlace.focus();
  }

  _toggleType() {
    if (inputType.options[inputType.selectedIndex].text == 'Other') {
      inputType.closest('.form__row').classList.toggle('form__row--hidden');
      inputNote.closest('.form__row').classList.toggle('form__row--hidden');
    }
  }

  _newVisit(e) {
    e.preventDefault();
    //get data from form
    let type = inputType.value;
    let note = '';
    const place = inputPlace.value;
    const from = inputFrom.value;
    const to = inputTo.value;

    //check if data is valid
    if (type === 'Other') {
      type = inputNote.value;
      note = 'Other';
    }

    //create visit object
    const visit = new Visit(this.#mapEvent.latlng, type, place, from, to, note);

    //add new object into visits array
    this.#visits.push(visit);

    //render visit on map as marker
    this._renderVisitMarker(visit);

    //render visits on list
    this._renderVisits(visit);

    //hide form and clear input fields
    inputPlace.value = '';
    inputFrom.value = '10:00';
    inputTo.value = '12:00';
    if (inputNote) {
      inputNote.value = '';
      this._toggleType();
    }
    inputType.value = '';
    form.classList.add('hidden');

    //set local storage to all visits
    this._setLocalStorage();
  }

  _renderVisitMarker(visit) {
    L.marker(visit.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className:
            visit.note == 'Other' ? `Other--popup` : `${visit.type}--popup`,
        })
      )
      .setPopupContent(visit.description)
      .openPopup();
  }

  _renderVisits(visit) {
    let html = `<li class="visit visit--${
      visit.note == 'Other' ? 'Other' : visit.type
    }" data-id="${visit.id}">
    
          <h2 class="visit__title">${visit.description}</h2>

          <div class="visit__details">
            <span class="visit__icon">📌</span>
            <span class="visit__value">${visit.place}</span>
          </div>
          
          <div class="visit__details">
            <span class="visit__icon">⏱</span>
            <span class="visit__value">${visit.from}</span>
          </div>

          <div class="visit__details">
            <span class="visit__icon">⏱</span>
            <span class="visit__value">${visit.to}</span>
          </div>

        </li>`;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    if (!this.#map) return;
    const visitEl = e.target.closest('.visit');
    if (!visitEl) return;
    const visit = this.#visits.find(vis => vis.id === visitEl.dataset.id);
    this.#map.setView(visit.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem('visits', JSON.stringify(this.#visits));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('visits'));
    if (!data) return;
    this.#visits = data;
    this.#visits.forEach(visit => {
      this._renderVisits(visit);
    });
  }

  reset() {
    localStorage.removeItem('visits');
    location.reload;
  }
}

const app = new App();
