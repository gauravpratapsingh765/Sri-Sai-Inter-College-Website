// ===== HERO SLIDER =====
let currentSlide = 0;
const totalSlides = 3;

function goSlide(n) {
    document.getElementById('slide-' + currentSlide).classList.remove('active');
    document.querySelectorAll('.hero-dots span')[currentSlide].classList.remove('active');
    currentSlide = n;
    document.getElementById('slide-' + currentSlide).classList.add('active');
    document.querySelectorAll('.hero-dots span')[currentSlide].classList.add('active');
}

setInterval(() => {
    goSlide((currentSlide + 1) % totalSlides);
}, 5000);

// ===== NAV =====
function toggleNav() {
    const nav = document.getElementById('navLinks');
    nav.classList.toggle('open');
}
document.addEventListener('click', (e) => {
    const nav = document.getElementById('navLinks');
    const ham = document.getElementById('hamburger');
    if (!nav.contains(e.target) && !ham.contains(e.target)) {
        nav.classList.remove('open');
    }
});

// Mobile dropdown
document.querySelectorAll('.dropdown > a').forEach(a => {
    a.addEventListener('click', (e) => {
        if (window.innerWidth <= 900) {
            e.preventDefault();
            a.parentElement.classList.toggle('open');
        }
    });
});

// ===== SCROLL ANIMATIONS =====
const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    observer.observe(el);
});

// ===== COUNTER ANIMATION =====
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.done) {
            e.target.dataset.done = true;
            const target = parseInt(e.target.dataset.target);
            let count = 0;
            const step = Math.ceil(target / 60);
            const timer = setInterval(() => {
                count = Math.min(count + step, target);
                e.target.textContent = count.toLocaleString() + (e.target.closest('.stat-item').querySelector('.stat-label').textContent.includes('%') ? '+' : '+');
                if (count >= target) {
                    e.target.textContent = target.toLocaleString() + '+';
                    clearInterval(timer);
                }
            }, 30);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    counterObserver.observe(el);
});

// ===== BACK TO TOP =====
window.addEventListener('scroll', () => {
    const bt = document.getElementById('backTop');
    if (window.scrollY > 400) bt.classList.add('visible');
    else bt.classList.remove('visible');
});

// ===== TABS =====
function switchTab(id, btn) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    // Re-trigger animations
    document.querySelectorAll('#' + id + ' .reveal').forEach(el => {
        el.classList.remove('visible');
        setTimeout(() => el.classList.add('visible'), 50);
    });
}

// ===== IMAGE UPLOAD =====
function previewImage(input, previewId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.getElementById(previewId);
            const placeholder = input.closest('label');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
                if (placeholder) placeholder.style.display = 'none';
            }
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function galleryPreview(input, index) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('gallery-img-' + index);
            const label = input.closest('.gallery-item').querySelector('.gallery-placeholder');
            img.src = e.target.result;
            img.style.display = 'block';
            if (label) label.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function uploadTopperPhoto(container) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            container.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        };
        reader.readAsDataURL(e.target.files[0]);
    };
    input.click();
}

// ===== MODALS =====
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}
function openAddTopperModal() {
    document.getElementById('topperModal').classList.add('open');
}
function openAddFacultyModal() {
    document.getElementById('facultyModal').classList.add('open');
}

// ===== FORM SUBMIT =====

function submitEnquiry() {
    // Collect the data from the form
    const templateParams = {
        student_name: document.getElementById('adm-name').value,
        class_applied: document.getElementById('adm-class').value,
        parent_name: document.getElementById('adm-parent').value,
        mobile: document.getElementById('adm-phone').value,
        branch: document.getElementById('adm-branch').value,
        message: document.getElementById('adm-message').value
    };

    // Basic Validation: Ensure required fields aren't empty
    if (!templateParams.student_name || !templateParams.mobile || !templateParams.class_applied) {
        alert("Please fill in all required fields (*)");
        return;
    }

    // Change button text to show it's working
    const submitBtn = document.querySelector('.form-submit');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = "Sending...";
    submitBtn.disabled = true;

    // Send the email via EmailJS
    emailjs.send('service_k89z5zo', 'template_funqrfi', templateParams)
        .then(function(response) {
            // Success: Update the modal and show it
            document.getElementById('modalMessage').textContent = "Your admission enquiry has been submitted! Our counsellor will contact you within 24 hours. Thank you for choosing Sri Sai Inter College.";
            document.getElementById('successModal').classList.add('open');
            
            // Clear the form fields
            document.getElementById('adm-name').value = '';
            document.getElementById('adm-class').value = '';
            document.getElementById('adm-parent').value = '';
            document.getElementById('adm-phone').value = '';
            document.getElementById('adm-branch').value = '';
            document.getElementById('adm-message').value = '';

            // Reset button
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;

        }, function(error) {
            // Error handling
            alert("Sorry, we couldn't send your enquiry. Please try again or call us directly.");
            console.error('EmailJS Error:', error);
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        });
}



// Active nav link on scroll
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.getAttribute('id');
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.remove('active');
        if (a.getAttribute('href') === '#' + current) a.classList.add('active');
    });
});


// Submit Contact us Form

function submitContact() {
    // 1. Get references to the button to show loading state
    const contactBtn = document.querySelector('.submit-btn');
    const originalBtnText = contactBtn.innerHTML;

    // 2. Collect data using the IDs from the HTML I gave you
    const contactParams = {
        from_name: document.getElementById('cf-name').value,
        mobile: document.getElementById('cf-phone').value,
        user_email: document.getElementById('cf-email').value,
        subject: document.getElementById('cf-subject').value,
        message: document.getElementById('cf-message').value
    };

    // 3. Validation: Ensure required fields are not empty
    if (!contactParams.from_name || !contactParams.mobile || !contactParams.message) {
        alert("Please fill in all required fields (Name, Mobile, and Message).");
        return;
    }

    // 4. Visual Feedback: Disable button while sending
    contactBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    contactBtn.disabled = true;

    // 5. Send to EmailJS

    emailjs.send('service_k89z5zo', 'template_1v2lszb', contactParams)
        .then(function(response) {
            // SUCCESS: Show the modal you already have in your code
            document.getElementById('modalMessage').textContent = "Thank you " + contactParams.from_name + "! Your message regarding " + contactParams.subject + " has been sent successfully.";
            document.getElementById('successModal').classList.add('open');
            
            // Clear the contact form fields
            document.getElementById('cf-name').value = '';
            document.getElementById('cf-phone').value = '';
            document.getElementById('cf-email').value = '';
            document.getElementById('cf-message').value = '';
            
            // Reset Button
            contactBtn.innerHTML = originalBtnText;
            contactBtn.disabled = false;

            console.log('CONTACT SUCCESS!', response.status, response.text);
        }, function(error) {
            // ERROR: Alert the user
            alert("Failed to send message. Please check your internet connection and try again.");
            contactBtn.innerHTML = originalBtnText;
            contactBtn.disabled = false;
            console.error('CONTACT FAILED...', error);
        });
}