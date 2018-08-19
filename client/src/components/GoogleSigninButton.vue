<template>
  <div class="googlesigninbutton">
    <a class="googlesigninlink" @mouseenter="hover=true" @mouseleave="hover=false" @click="click">
      <img v-if="!hover" src="@/assets/googlesigninbutton/btn_google_signin_light_normal_web.png" srcset="@/assets/googlesigninbutton/btn_google_signin_light_normal_web@2x.png 2x" />
      <img v-if="hover" src="@/assets/googlesigninbutton/btn_google_signin_light_pressed_web.png" srcset="@/assets/googlesigninbutton/btn_google_signin_light_pressed_web@2x.png 2x" />
    </a>
  </div>
</template>

<script>
export default {
  name: "googlesigninbutton",
  components: {},
  data() {
    return {
      hover: false
    };
  },
  methods: {
    click() {
      console.log("GoogleSigninButton clicked");
      this.$auth
        .authenticate("google")
        .then(response => {
          console.log("vue-authenticate response: ", response);
        })
        .catch(error => {
          console.log("vue-authenticate error: ", error);
        });
    }
  }
};
</script>

<style lang="sass">

</style>
