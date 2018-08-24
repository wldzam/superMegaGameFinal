/****************************
 *
 *
 *
 Только контроль верхнего слайдера
 и все



 **********************************/
(function () {

    var header = document.getElementsByTagName('header')[0];
    var headerSwitchTimeOut = -1;
    var headerMouseDown = false;


    /*   TODO  реакции    обработка*/


    document.addEventListener('mousedown', function () {
        headerMouseDown = true;
    }, false);

    document.addEventListener('mouseup', function () {
        headerMouseDown = false;
    }, false);

    header.addEventListener('mouseover', function () {
        if (!headerMouseDown) {


            // Убедитесь, что предыдущий вызов для переключения заголовка
            //  в очереди

            clearTimeout(headerSwitchTimeOut);

            // чтобы само не открывалось - ставим короткий таймаут

            headerSwitchTimeOut = setTimeout(function () {
                header.setAttribute('class', 'open')
            }, 100);
        }
    }, false);

    header.addEventListener('mouseout', function () {
        // Убедитесь, что предыдущий вызов для переключения заголовка
        //  в очереди
        clearTimeout(headerSwitchTimeOut);

        // чтобы само не открывалось - ставим короткий таймаут
        headerSwitchTimeOut = setTimeout(function () {
            header.setAttribute('class', '')
        }, 100);
    }, false);

})();
