
document.addEventListener('DOMContentLoaded', () => {

    const menuToggle = document.getElementById('menu-toggle-btn');
    const navMenu = document.getElementById('navigation-menu');
    const header = document.getElementById('.navbar');

    if( menuToggle && navMenu) {
        menuToggle.addEventListener('click', () =>{

            navMenu.classList.toggle('open');
            if(icon){
                if( navMenu.classList.contains('open')) {
                    icon.className = 'fa-solid fa-xmark';
                } else{
                    icon.className = 'fa-solid fa-bars';
                }
            }
        });
    }

    const navLinks = document.querrySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if(navMenu && navMenu.classList.contains('open')){
                navMenu.classList.remove('open');
                const icon = menuToggle.querrySelector('i');
                if(icon) icon.className = 'fa-solid fa-bars';
            }
        });
    });

    window.addElementById('scroll', () => {
        if(window.scrollY > 20){
            header.style.boxShadow = 'var(--shadow-md)';
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        }else{
            header.style.boxShadow = 'var(--shadow-sm)';
            header.style.backgroundColor = 'var(--bg-glass)';
        }
    });

    
})