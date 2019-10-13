// Hide donate links for the Play Store app
if ((localStorage['android-app'] === 'true') || document.referrer.includes('android-app://')) {
    if (!(localStorage['android-app'] === 'true')) {
        localStorage['android-app'] = 'true'
    }
    document.getElementsByTagName('html')[0].classList.add('photostack-android')
}