document.addEventListener('DOMContentLoaded', function () {
    var menuBtn = document.getElementById('menuBtn');
    var mobileMenu = document.getElementById('mobileMenu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
        mobileMenu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () {
                mobileMenu.classList.add('hidden');
            });
        });
    }

    var page = document.body.getAttribute('data-page');
    if (page) {
        document.querySelectorAll('#desktopNav a, #mobileMenu a').forEach(function (a) {
            var href = a.getAttribute('href');
            if (href === page + '.html') {
                a.classList.add('text-primary');
                a.classList.add('font-semibold');
            }
        });
    }

    var bookingForm = document.getElementById('bookingForm');
    var bookingSuccess = document.getElementById('bookingSuccess');
    var bookingError = document.getElementById('bookingError');

    var API_BASE = 'http://localhost:3000';

    function formatTime(time24) {
        var parts = time24.split(':');
        var h = parseInt(parts[0], 10);
        var m = parts[1] || '00';
        var suffix = h >= 12 ? 'PM' : 'AM';
        var hr = h % 12;
        if (hr === 0) hr = 12;
        return hr + ':' + m + ' ' + suffix;
    }

    function todayStr() {
        var d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function loadSlots(dateStr) {
        var slotGrid = document.getElementById('slotGrid');
        var slotStatus = document.getElementById('slotStatus');
        var slotIdInput = document.getElementById('slotId');
        var doctorId = document.getElementById('doctorId').value;

        slotIdInput.value = '';
        if (!slotGrid || !dateStr) return;
        slotGrid.innerHTML = '<p class="text-xs text-gray-400 col-span-full" id="slotStatus">Loading available slots...</p>';

        fetch(API_BASE + '/api/doctors/' + doctorId + '/slots?date=' + dateStr)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                var available = (data.slots || []).filter(function (s) { return s.status === 'available'; });
                if (available.length === 0) {
                    slotGrid.innerHTML = '<p class="text-xs text-gray-400 col-span-full">No slots available for this date.</p>';
                    return;
                }
                var html = '';
                available.forEach(function (s) {
                    html += '<button type="button" data-slotid="' + s.id + '" data-time="' + s.time + '" class="slot-btn border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-primary hover:text-white hover:border-primary transition bg-white">' + formatTime(s.time) + '</button>';
                });
                slotGrid.innerHTML = html;

                slotGrid.querySelectorAll('.slot-btn').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        slotGrid.querySelectorAll('.slot-btn').forEach(function (b) {
                            b.classList.remove('bg-primary', 'text-white', 'border-primary');
                            b.classList.add('bg-white', 'text-gray-700');
                        });
                        btn.classList.remove('bg-white', 'text-gray-700');
                        btn.classList.add('bg-primary', 'text-white', 'border-primary');
                        slotIdInput.value = btn.getAttribute('data-slotid');
                    });
                });
            })
            .catch(function () {
                slotGrid.innerHTML = '<p class="text-xs text-red-500 col-span-full">Could not load slots. Is the server running?</p>';
            });
    }

    if (bookingForm) {
        var dateInput = document.getElementById('apptDate');
        if (dateInput) {
            dateInput.min = todayStr();
            dateInput.addEventListener('change', function () {
                loadSlots(dateInput.value);
            });
        }

        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();
            if (bookingError) bookingError.classList.add('hidden');

            var doctorId = document.getElementById('doctorId').value;
            var slotId = document.getElementById('slotId').value;
            var date = document.getElementById('apptDate').value;
            var branch = document.getElementById('branch').value;
            var treatment = document.getElementById('treatment').value;
            var source = document.getElementById('source').value;
            var notes = document.getElementById('notes').value;

            if (!slotId) {
                if (bookingError) {
                    bookingError.textContent = 'Please select a time slot for your appointment.';
                    bookingError.classList.remove('hidden');
                    bookingError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }

            var symptoms = [treatment, branch ? 'Branch: ' + branch : '', notes].filter(Boolean).join(' | ');

            fetch(API_BASE + '/api/appointments/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: doctorId,
                    date: date,
                    slotId: slotId,
                    patient: {
                        name: document.getElementById('patientName').value.trim(),
                        email: document.getElementById('patientEmail').value.trim(),
                        phone: document.getElementById('patientPhone').value.trim(),
                        symptoms: symptoms,
                        bookingChannel: 'website'
                    },
                    appointmentType: 'in_person',
                    updatedBy: 'Website'
                })
            })
            .then(function (res) {
                if (!res.ok) {
                    return res.json().then(function (data) {
                        throw new Error(data.error || 'Could not book this slot.');
                    });
                }
                return res.json();
            })
            .then(function () {
                bookingSuccess.classList.remove('hidden');
                bookingForm.reset();
                bookingForm.querySelector('.slot-btn') && loadSlots(date);
                document.getElementById('slotId').value = '';
                bookingSuccess.scrollIntoView({ behavior: 'smooth' });
            })
            .catch(function (err) {
                if (bookingError) {
                    bookingError.textContent = err.message;
                    bookingError.classList.remove('hidden');
                    bookingError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                loadSlots(date);
            });
        });
    }

    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    if (lightbox && lightboxImg) {
        document.querySelectorAll('[data-lightbox]').forEach(function (el) {
            el.addEventListener('click', function () {
                lightboxImg.src = el.src;
                lightbox.classList.remove('hidden');
            });
        });
        lightbox.addEventListener('click', function () {
            lightbox.classList.add('hidden');
        });
    }
});
