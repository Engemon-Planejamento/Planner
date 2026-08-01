const btn_menu = document.querySelector('.btnmenu');
const cont_menu = document.getElementById('menu');

// Abrir/fechar com toggle
btn_menu.addEventListener("click", (e) => {
    e.stopPropagation();
    cont_menu.classList.toggle('active');
});

// ========================================================== */
// FECHAR AO CLICAR NO OVERLAY (fora do nav)                 */
// ========================================================== */

cont_menu.addEventListener('click', function(e) {
    // Verifica se o clique foi no próprio #menu (overlay) e não no nav
    if (e.target === cont_menu) {
        cont_menu.classList.remove('active');
    }
});

// Fechar ao clicar fora (mantido)
document.addEventListener('click', function(e) {
    if (!cont_menu.contains(e.target) && !btn_menu.contains(e.target)) {
        cont_menu.classList.remove('active');
    }
});

// Fechar com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cont_menu.classList.remove('active');
    }
});

// Fechar ao clicar em link
cont_menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
        cont_menu.classList.remove('active');
    });
});