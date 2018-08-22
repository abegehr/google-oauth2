import Vue from "vue";
import VueAxios from "vue-axios";
import VueAuthenticate from "vue-authenticate";
import axios from "axios";

Vue.use(VueAxios, axios);
Vue.use(VueAuthenticate, {
  baseUrl: "http://localhost:3000", // Your API domain

  providers: {
    google: {
      clientId:
        "835550459441-39mgm8hc2hris3rcrj6vk63jvs2hdkam.apps.googleusercontent.com",
      redirectUri: "http://localhost:8080/auth/cb",
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/gmail.metadata"
      ],
      requiredUrlParams: ["scope", "access_type"],
      accessType: "offline"
    }
  }
});
