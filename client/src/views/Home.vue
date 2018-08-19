<template>
  <div class="home">
    <GoogleSigninButton />
  </div>
</template>

<script>
import GoogleSigninButton from "@/components/GoogleSigninButton.vue";

export default {
  name: "home",
  components: {
    GoogleSigninButton
  }
};
</script>
