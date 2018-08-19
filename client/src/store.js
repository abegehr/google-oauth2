import Vue from "vue";
import Vuex from "vuex";
import VueAxios from "vue-axios";
import VueAuthenticate from "vue-authenticate";
import axios from "axios";

Vue.use(Vuex);
Vue.use(VueAxios, axios);

const vueAuth = new VueAuthenticate(Vue.prototype.$http, {
  baseUrl: "http://localhost:4000"
});

export default new Vuex.Store({
  state: {},
  getters: {
    isAuthenticated() {
      return vueAuth.isAuthenticated();
    }
  },
  mutations: {},
  actions: {
    login(context, payload) {
      vueAuth.login(payload.user, payload.requestOptions).then(response => {
        console.log("Authenticated! Response: ", response);
      });
    }
  }
});
