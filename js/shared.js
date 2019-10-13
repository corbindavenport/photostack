// Hide donate links for the Play Store app
if ((localStorage['paid'] === 'true') || document.referrer.includes('android-app://')) {
    if (!(localStorage['paid'] === 'true')) {
        localStorage['paid'] = 'true'
    }
    document.getElementsByTagName('html')[0].classList.add('photostack-paid')
}