const btn_menu = document.querySelector('.btnmenu')

btn_menu.addEventListener("click", ()=> {
    const cont_menu = document.querySelector('#menu')
    cont_menu.classList.toggle('menu')
})