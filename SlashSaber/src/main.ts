const page = document.getElementById("main");

let vue : typeof import("vue");
let Scene : any;
let vuetify : any;

async function loadVue() {
    vue = await import("vue");
    Scene = vue.defineAsyncComponent(() =>
        import("./pages/Scene.vue")
    );
    await import("vuetify/_styles.scss");
    const vuet = await import("vuetify");
    const components = await import("vuetify/components");
    const directives = await import("vuetify/directives");
    await import("@mdi/font/css/materialdesignicons.css");

    vuetify = vuet.createVuetify({
        components,
        directives,
    });
    
    // Auto-load the game scene directly
    loadScene();
}

async function loadScene() {
    if(!page) return;

    // Hide the landing page immediately
    page.style.display = "none";

    vue.createApp(Scene).use(vuetify).provide("switchPage", () => {
        // Do nothing - no page switching needed
    }).mount("#app");
}

import "./style.scss";
loadVue();