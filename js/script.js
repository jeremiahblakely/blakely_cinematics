/* ============================================ */
/* BLAKELY CINEMATICS - MAIN JAVASCRIPT        */
/* Author: Jeremiah Blakely                    */
/* Version: 1.0                                */
/* ============================================ */

/* ============================================ */
/* TABLE OF CONTENTS                           */
/* ============================================ */
/* 1. GLOBAL VARIABLES
   2. CUSTOM CURSOR
   3. LOADING SCREEN
   4. NAVIGATION
   5. HERO SLIDER
   6. PORTFOLIO FILTER
   7. TESTIMONIAL SLIDER
   8. SMOOTH SCROLLING
   9. FORM HANDLING
   10. SCROLL ANIMATIONS
   11. INITIALIZATION
*/

/* ============================================ */
/* 1. GLOBAL VARIABLES                         */
/* ============================================ */
let currentSlide = 0;
let currentTestimonial = 0;
let isMenuOpen = false;

/* ============================================ */
/* 2. CUSTOM CURSOR                            */
/* ============================================ */
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');
    
    if (!cursor || !cursorFollower) return;
    
    // Move cursor with mouse
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = e.clientX - 10 + 'px';
            cursorFollower.style.top = e.clientY - 10 + 'px';
        }, 100);
    });

    // Add hover effect to interactive elements
    const hoverElements = document.querySelectorAll('a, button, input, textarea, .filter-btn, .testimonial-dot');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.classList.add('hover');
        });
        
        element.addEventListener('mouseleave', () => {
            cursor.classList.remove('hover');
        });
    });
}

/* ============================================ */
/* 3. LOADING SCREEN                           */
/* ============================================ */
function hideLoadingScreen() {
    const loader = document.querySelector('.loader');
    if (!loader) return;
    
    // Hide loader after page loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 2000);
    });
}

/* ============================================ */
/* 4. NAVIGATION                               */
/* ============================================ */
function initNavigation() {
    const nav = document.querySelector('nav');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    // Scroll effect for navigation
    if (nav) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });
    }
    
    // Mobile menu toggle
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            isMenuOpen = !isMenuOpen;
            mobileToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                isMenuOpen = false;
                mobileToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }
}

/* ============================================ */
/* 5. HERO SLIDER                              */
/* ============================================ */
function initHeroSlider() {
    const heroSlider = document.querySelector('.hero-slider');
    if (!heroSlider) return;// Hero image data with S3 URLs (expanded selection)
    const heroImages = [
        {
            name: 'Art Portrait',
            slug: 'art1',
            alt: 'Dramatic Artistic Portrait with Cinematic Lighting'
        },
        {
            name: 'Jan Portrait 1',
            slug: 'jan1',
            alt: 'Professional Cinematic Portrait'
        },
        {
            name: 'Jan Portrait 2',
            slug: 'jan2',
            alt: 'Dramatic Light Study Portrait'
        },
        {
            name: 'Jan Portrait 3',
            slug: 'jan3',
            alt: 'Creative Portrait Photography'
        },
        {
            name: 'Wolf Portrait 1',
            slug: 'wolf1',
            alt: 'Intense Character Portrait'
        },
        {
            name: 'Wolf Portrait 2',
            slug: 'wolf2',
            alt: 'Moody Cinematic Portrait'
        },
        {
            name: 'Bruno & Jan',
            slug: 'brono&jan',
            alt: 'Dynamic Duo Portrait Session'
        },
        {
            name: 'Rod & Sus',
            slug: 'rod&sus',
            alt: 'Couple Portrait Session'
        }
    ];
    
    function getImageUrl(imageName) {
const urls = {
'art1': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Aart1-bg-4k.jpg',
'jan1': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Ajan1-bg-4k.jpg',
'jan2': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Ajan2-bg-4k.jpg',
'jan3': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Ajan3-bg-4k.jpg',
'wolf1': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Awolf1-bg-4k.jpg',
'wolf2': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Awolf2-bg-4k.jpg',
'brono&jan': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Abrono%26jan-bg-4k.jpg',
'rod&sus': 'https://blakely-cinematics.s3.us-east-1.amazonaws.com/images/hero/4k/hero%3Arod%26sus-bg-4k.jpg'
};
return urls[imageName];
}
    
    // Create slide elements
    function createSlides() {
        heroSlider.innerHTML = ''; // Clear existing slides
        
        heroImages.forEach((image, index) => {
            const slide = document.createElement('div');
            slide.className = index === 0 ? 'slide active' : 'slide';
            
            const img = document.createElement('img');
            img.src = getImageUrl(image.slug);
            img.alt = image.alt;
            img.loading = index === 0 ? 'eager' : 'lazy'; // Load first image immediately
            
            // Handle image load errors
            img.onerror = function() {
                console.warn(`Failed to load hero image: ${image.name}`);
            };
            
            slide.appendChild(img);
            heroSlider.appendChild(slide);
        });
    }
    
    // Initialize slides
    createSlides();
    
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    
    // Preload next few images
    function preloadImages() {
        const preloadCount = Math.min(2, heroImages.length - 1); // Reduced preload count
        
        for (let i = 1; i <= preloadCount; i++) {
            const nextIndex = (currentSlide + i) % heroImages.length;
            const img = new Image();
            img.src = getImageUrl(heroImages[nextIndex].slug);
        }
    }
    
    function nextSlide() {
        // Remove active class from current slide
        slides[currentSlide].classList.remove('active');
        
        // Move to next slide
        currentSlide = (currentSlide + 1) % slides.length;
        
        // Add active class to new slide
        slides[currentSlide].classList.add('active');
        
        // Preload upcoming images
        preloadImages();
    }
    
    // Start preloading after initial load
    setTimeout(preloadImages, 1000);
    
    // Change slide every 6 seconds (slightly longer for better viewing)
    const slideInterval = setInterval(nextSlide, 6000);
    
    // Pause on hover (optional)
    heroSlider.addEventListener('mouseenter', () => {
        clearInterval(slideInterval);
    });
    
    let resumeInterval;
    heroSlider.addEventListener('mouseleave', () => {
        resumeInterval = setInterval(nextSlide, 6000);
    });
    
    // No need for resize handling since we're using consistent 1080p images
}

/* ============================================ */
/* 6. PORTFOLIO FILTER                         */
/* ============================================ */
function initPortfolioFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (filterButtons.length === 0) return;
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter portfolio items
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    setTimeout(() => {
                        item.style.opacity = '1';
                    }, 100);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => {
                        item.style.display = 'none';
                    }, 300);
                }
            });
        });
    });
}

/* ============================================ */
/* 7. TESTIMONIAL SLIDER                       */
/* ============================================ */
function initTestimonialSlider() {
    const testimonials = document.querySelectorAll('.testimonial');
    const testimonialDots = document.querySelectorAll('.testimonial-dot');
    
    if (testimonials.length === 0) return;
    
    function showTestimonial(index) {
        // Hide all testimonials
        testimonials.forEach(t => t.classList.remove('active'));
        testimonialDots.forEach(d => d.classList.remove('active'));
        
        // Show selected testimonial
        testimonials[index].classList.add('active');
        if (testimonialDots[index]) {
            testimonialDots[index].classList.add('active');
        }
    }
    
    // Click dots to change testimonial
    testimonialDots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentTestimonial = index;
            showTestimonial(currentTestimonial);
        });
    });
    
    // Auto-rotate testimonials every 5 seconds
    setInterval(() => {
        currentTestimonial = (currentTestimonial + 1) % testimonials.length;
        showTestimonial(currentTestimonial);
    }, 5000);
}

/* ============================================ */
/* 8. SMOOTH SCROLLING                         */
/* ============================================ */
function initSmoothScrolling() {
    // Handle all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/* ============================================ */
/* 9. FORM HANDLING                            */
/* ============================================ */
function initFormHandling() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            service: document.getElementById('service').value,
            message: document.getElementById('message').value
        };
        
        // Log form data (replace with actual form submission)
        console.log('Form submitted:', formData);
        
        // Show success message
        const button = this.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        button.textContent = 'MESSAGE SENT!';
        button.style.background = '#D4AF37'; // Gold color
        
        // Reset form
        this.reset();
        
        // Reset button after 3 seconds
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 3000);
        
        // TODO: Add actual form submission logic here
        // You can use services like Formspree, EmailJS, or Netlify Forms
    });
}

/* ============================================ */
/* 10. SCROLL ANIMATIONS                       */
/* ============================================ */
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Animate service cards on scroll
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.8s ease';
        observer.observe(card);
    });
    
    // You can add more elements to animate on scroll here
}

/* ============================================ */
/* 11. INITIALIZATION                          */
/* ============================================ */
// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Blakely Cinematics website initialized');
    
    // Initialize all components
    initCustomCursor();
    hideLoadingScreen();
    initNavigation();
    initHeroSlider();
    initPortfolioFilter();
    initTestimonialSlider();
    initSmoothScrolling();
    initFormHandling();
    initScrollAnimations();
});

// Handle window resize
window.addEventListener('resize', () => {
    // Add any resize-specific logic here
    if (window.innerWidth > 768 && isMenuOpen) {
        // Close mobile menu if window becomes larger
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (mobileToggle && navLinks) {
            isMenuOpen = false;
            mobileToggle.classList.remove('active');
            navLinks.classList.remove('active');
        }
    }
});

/* ============================================ */
/* UTILITY FUNCTIONS                           */
/* ============================================ */

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Export functions if using modules (optional)
// export { initCustomCursor, initNavigation, initHeroSlider };