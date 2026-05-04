document.addEventListener('DOMContentLoaded', () => {
    // Fetch blocked dates
    let blockedDatesArray = [];
    fetch('/api/blocked-dates')
        .then(res => res.json())
        .then(data => {
            blockedDatesArray = data;
        })
        .catch(err => console.error('Error fetching blocked dates:', err));

    function isDateBlocked(dateStr) {
        return blockedDatesArray.includes(dateStr);
    }

    function checkDatesRange(startStr, endStr) {
        const start = new Date(startStr);
        const end = new Date(endStr);
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (isDateBlocked(dateStr)) {
                return dateStr;
            }
        }
        return null;
    }

    // 1. Preloader
    const preloader = document.querySelector('.preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 800); // Small delay to show the animation
    }

    // 2. Booking Form Simulation
    const bookingForm = document.getElementById('bookingForm');
    const phoneInput = document.getElementById('phone');

    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            // Allow only digits, plus, space, parentheses, and dashes (remove letters)
            e.target.value = e.target.value.replace(/[^\d\+\-\(\)\s]/g, '');
        });
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const checkin = document.getElementById('checkin').value;
            const checkout = document.getElementById('checkout').value;
            const guests = document.getElementById('guests').value;
            
            // Phone validation
            const digitsOnly = phone.replace(/[^\d]/g, '');
            if (digitsOnly.length < 10 || digitsOnly.length > 12) {
                alert('Будь ласка, введіть коректний номер телефону (мінімум 10 цифр, наприклад: 098... або +380...).');
                return;
            }

            if (new Date(checkin) >= new Date(checkout)) {
                alert('Дата виїзду повинна бути пізніше дати заїзду.');
                return;
            }

            const blockedInBetween = checkDatesRange(checkin, checkout);
            if (blockedInBetween) {
                alert(`На жаль, період бронювання включає заброньовану дату: ${blockedInBetween}. Будь ласка, оберіть інші дати.`);
                return;
            }

            const btn = bookingForm.querySelector('.btn-submit');
            const originalText = btn.innerText;
            btn.innerText = 'Надсилаємо...';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            try {
                const response = await fetch('/api/booking', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        phone,
                        checkin,
                        checkout,
                        guests
                    })
                });

                if (response.ok) {
                    alert('Дякуємо! Ваше бронювання надіслано менеджеру. Ми зв\'яжемося з вами найближчим часом.');
                    bookingForm.reset();
                    // Close modal if it's open
                    if (typeof closeModal === 'function') closeModal();
                } else {
                    const error = await response.json();
                    alert('Помилка: ' + (error.error || 'Не вдалося надіслати запит.'));
                }
            } catch (err) {
                console.error(err);
                alert('Помилка з\'єднання з сервером. Спробуйте пізніше або зателефонуйте нам.');
            } finally {
                btn.innerText = originalText;
                btn.style.opacity = '1';
                btn.disabled = false;
            }
        });
    }

    // Set minimum date for checkin/checkout to today
    const checkinElem = document.getElementById('checkin');
    const checkoutElem = document.getElementById('checkout');
    if (checkinElem && checkoutElem) {
        const today = new Date().toISOString().split('T')[0];
        checkinElem.setAttribute('min', today);
        checkoutElem.setAttribute('min', today);

        const validateDate = (e) => {
            if (e.target.value && isDateBlocked(e.target.value)) {
                alert(`На жаль, на дату ${e.target.value} немає вільних місць.`);
                e.target.value = '';
            } else if (checkinElem.value && checkoutElem.value) {
                const blockedInBetween = checkDatesRange(checkinElem.value, checkoutElem.value);
                if (blockedInBetween) {
                    alert(`На жаль, період бронювання включає заброньовану дату: ${blockedInBetween}. Будь ласка, оберіть інші дати.`);
                    e.target.value = '';
                }
            }
        };

        checkinElem.addEventListener('change', validateDate);
        checkoutElem.addEventListener('change', validateDate);
    }
    // 3. Gallery Show More Button
    const showMoreBtn = document.getElementById('showMoreBtn');
    const hiddenGallery = document.getElementById('hiddenGallery');
    
    if (showMoreBtn && hiddenGallery) {
        showMoreBtn.addEventListener('click', () => {
            if (hiddenGallery.style.display === 'none') {
                hiddenGallery.style.display = 'block'; // Or whatever layout you use, here it falls back to block which masonry handles, wait, masonry-grid is a class using column-count, so block is fine
                showMoreBtn.innerText = 'Сховати фотографії';
            } else {
                hiddenGallery.style.display = 'none';
                showMoreBtn.innerText = 'Більше фотографій...';
                // Scroll back to top of gallery
                document.getElementById('gallery').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
    // 4. Floating Contact Button
    const contactBtn = document.getElementById('contactBtn');
    const contactPopup = document.getElementById('contactPopup');
    
    if (contactBtn && contactPopup) {
        contactBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contactPopup.classList.toggle('hidden');
        });

        // Close popup when clicking outside
        document.addEventListener('click', () => {
            contactPopup.classList.add('hidden');
        });

        contactPopup.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // 5. Advanced Scroll Effects
    const header = document.querySelector('.navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (!header) return;

        // Header shrinking
        if (currentScroll > 50) {
            header.classList.add('shrunk');
        } else {
            header.classList.remove('shrunk');
        }
    });

    // Improved Intersection Observer
    const revealElements = document.querySelectorAll('.reveal, .room-card, .service-card, .faq-item');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target); // Animate only once
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    revealElements.forEach(el => {
        el.classList.add('reveal'); // Ensure reveal class is present
        revealObserver.observe(el);
    });

    // 6. Magnetic Button Effect (Subtle)
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .contact-btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
    // 7. Booking Modal Logic
    const bookingModal = document.getElementById('bookingModal');
    const openModalBtns = document.querySelectorAll('.open-booking, .room-card');
    const closeModalBtn = document.getElementById('closeModal');
    const modalOverlay = document.querySelector('.modal-overlay');

    const openModal = () => {
        bookingModal.classList.add('active');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        bookingModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    };

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    // Escape key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (bookingModal.classList.contains('active') || imageModal.classList.contains('active'))) {
            closeModal();
            imageModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        }
    });
    // 8. Image Lightbox Logic
    const imageModal = document.getElementById('imageModal');
    const lightboxImage = document.getElementById('lightboxImage');
    const closeImageModalBtn = document.getElementById('closeImageModal');
    const galleryImages = document.querySelectorAll('.masonry-item img');

    galleryImages.forEach(img => {
        img.style.cursor = 'zoom-in';
        img.addEventListener('click', () => {
            lightboxImage.src = img.src;
            imageModal.classList.add('active');
            document.body.classList.add('modal-open');
        });
    });

    if (closeImageModalBtn) {
        closeImageModalBtn.addEventListener('click', () => {
            imageModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    }

    if (imageModal) {
        imageModal.querySelector('.modal-overlay').addEventListener('click', () => {
            imageModal.classList.remove('active');
            document.body.classList.remove('modal-open');
        });
    }
    // 9. Advanced Scroll Fade Effect (Fade out when leaving viewport)
    const animatedElements = document.querySelectorAll('.reveal, .room-card, .service-card, .split-content, .split-image');
    
    const handleScrollAnimations = () => {
        const viewportHeight = window.innerHeight;
        const fadeThreshold = 200; // Distance from top/bottom to start fading

        animatedElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            
            // Calculate distance from viewport edges
            const distFromTop = rect.bottom;
            const distFromBottom = viewportHeight - rect.top;

            let opacity = 1;

            if (distFromTop < fadeThreshold) {
                // Fading out at the top
                opacity = Math.max(0, distFromTop / fadeThreshold);
            } else if (distFromBottom < fadeThreshold) {
                // Fading out at the bottom
                opacity = Math.max(0, distFromBottom / fadeThreshold);
            }

            // Apply opacity and a subtle scale/shift
            el.style.opacity = opacity;
            const scale = 0.95 + (opacity * 0.05);
            const translate = (1 - opacity) * 20; // Move slightly away
            
            // Only apply if it's already "revealed" or has a base opacity
            if (el.classList.contains('active') || !el.classList.contains('reveal')) {
                el.style.transform = `scale(${scale}) translateY(${rect.top < 0 ? -translate : translate}px)`;
            }
        });
    };

    window.addEventListener('scroll', () => {
        requestAnimationFrame(handleScrollAnimations);
    });

    // 9.1 Side Decorations Observer
    const decoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                entry.target.classList.remove('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.side-decorated').forEach(section => {
        decoObserver.observe(section);
    });

    // 10. Hero Background Slideshow
    const slides = document.querySelectorAll('.hero-slides img');
    let currentSlide = 0;

    const nextSlide = () => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    if (slides.length > 1) {
        setInterval(nextSlide, 4000); // Change every 4 seconds
    }

    // 11. Show More Rooms Logic
    const showMoreRoomsBtn = document.getElementById('showMoreRooms');
    const extraRooms = document.getElementById('extraRooms');

    if (showMoreRoomsBtn && extraRooms) {
        showMoreRoomsBtn.addEventListener('click', () => {
            if (extraRooms.style.display === 'none' || extraRooms.style.display === '') {
                extraRooms.style.display = 'grid';
                showMoreRoomsBtn.innerText = 'Побачити менше';
                
                // Refresh animation for new elements
                setTimeout(() => {
                    handleScrollAnimations();
                }, 50);
            } else {
                extraRooms.style.display = 'none';
                showMoreRoomsBtn.innerText = 'Побачити більше';
                
                // Scroll back up to the main grid if they were deep in the extra rooms
                const roomsSection = document.getElementById('rooms');
                if (roomsSection) {
                    roomsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    }

    // Initial check
    handleScrollAnimations();
});
