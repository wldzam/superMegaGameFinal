'use strict'


var superMegaGame = new function () {

    // TODO для мобилок


    var isMobile = !!navigator.userAgent.toLowerCase().match(/ipod|ipad|iphone|android/gi);

    var DEFAULT_WIDTH = 900,
        DEFAULT_HEIGHT = 550,
        BORDER_WIDTH = 6,
        FRAMERATE = 60;


    //  TODO    VAR SSSSSSSSSSSSS


    // Типы шаров


    var ENEMY_RED = 'enemy';
    var ENERGY_GREEN = 'energy';

    // Размеры мира
    //мобилка или деск
    //пихаем в тернарку

    var world = {
        width: isMobile ? window.innerWidth : DEFAULT_WIDTH,
        height: isMobile ? window.innerHeight : DEFAULT_HEIGHT
    };


    /*канва*/


    var canvas,
        context;

    var canvasBackground,
        contextBackground;

    // Дом элементы нашего меню
    var status;
    var panels;
    var message;
    var title;
    var startButton;

    // элементы игры

    //чужие и части в массивах


    var aliens = [];
    var particlesAfterBoom = [];
    var myShip;

    // Настройки мыши


    var mouseX = (window.innerWidth + world.width) * 0.5;
    var mouseY = (window.innerHeight + world.height) * 0.5;

    var mouseIsDown = false;
    var spaceIsDown = false;

    // Настройка игры и счет
    var playing = false;
    var score = 0;
    var time = 0;
    var duration = 0;
    var difficulty = 1;
    var lastspawn = 0;

    // Статистика


    var frameCount = 0; // Кадры
    var frameScore = 0; //кадры
    var collisionScore = 0; // Столкновения

    // Скорость мира
    /*  var velocity = {x: -1.3, y: 10};*/

    // Performance (FPS) tracking -- не знаю зачем мне это, на всякий случай
    var fps = 0;
    var fpsMin = 1000;
    var fpsMax = 0;
    var timeLastSecond = new Date().getTime();
    var frames = 0;


    /*TODO     собираем канву    */


    this.init = function () {

        canvas = document.getElementById('world');
        canvasBackground = document.getElementById('background');
        panels = document.getElementById('panels');
        status = document.getElementById('score');
        message = document.getElementById('message');
        title = document.getElementById('title');
        startButton = document.getElementById('startButton');

        if (canvas && canvas.getContext) {
            context = canvas.getContext('2d');

            contextBackground = canvasBackground.getContext('2d');

            // регистрируем события
            document.addEventListener('mousemove', documentMouseMoveHandler, false);
            document.addEventListener('mousedown', documentMouseDownHandler, false);
            document.addEventListener('mouseup', documentMouseUpHandler, false);
            canvas.addEventListener('touchstart', documentTouchStartHandler, false);
            document.addEventListener('touchmove', documentTouchMoveHandler, false);
            document.addEventListener('touchend', documentTouchEndHandler, false);
            window.addEventListener('resize', windowResizeHandler, false);
            startButton.addEventListener('click', startButtonClickHandler, false);
            document.addEventListener('keydown', documentKeyDownHandler, false);
            document.addEventListener('keyup', documentKeyUpHandler, false);

            // инит игрока
            myShip = new Player();

            // Принудительное первоначальное изменение размера,
            // чтобы убедиться, что пользовательский интерфейс правильно настроен
            windowResizeHandler();


            // TODO   // для мобилок настройки


            if (isMobile) {
                document.getElementsByTagName('header')[0].style.display = 'none';
                status.style.width = world.width + 'px';
                canvas.style.border = 'none';
            }

            animate(); // вкл анимацию
        }
    };

    function renderBackground() {
        var gradient = contextBackground.createRadialGradient
        (world.width * 0.5, world.height * 0.5, 0, world.width * 0.5, world.height * 0.5, 500);
        gradient.addColorStop(0, 'rgba(0, 70, 70, 1)');
        gradient.addColorStop(1, 'rgba(0, 8, 14, 1)');

        contextBackground.fillStyle = gradient;
        contextBackground.fillRect(0, 0, world.width, world.height);
    }


    /*TODO     клик на старт   */


    /**
     * Отлавливаем клик на СТАРТ
     */


    function startButtonClickHandler(event) {
        if (playing == false) {
            playing = true;

            // Сбрасываем по нулям счет и чужих
            aliens = [];
            score = 0;
            difficulty = 1;  //сложность - больше 10 не ставить

            // Сбрасываем счетчики фпс
            frameCount = 0;
            frameScore = 0;
            var ms = 0;
            collisionScore = 0;

            // сбрасываем игрока до дефолта
            myShip.energy = 100; //количество энергии -

            // Прячем менюшку
            panels.style.display = 'none';
            status.style.display = 'block';

            time = new Date().getTime();
        }
    }

    /*TODO    GAME OVER    */

    /**
     * GAME OVER!!!!!!!!!!!!!
     * показываем результаты
     */
    function gameOver() {
        playing = false;

        // время игры дата минус время
        duration = new Date().getTime() - time;

        // Показываем меню
        panels.style.display = 'block';

        // счет округляем
        score = Math.round(score);

        // Счет на экран UI
        title.innerHTML = 'Конец игры! (' + score + ' очков)';

        // Обновляем  status bar + счет и время
        var scoreText = 'Score: <span>' + Math.round
        (score) + '</span>';
        scoreText += ' Time: <span>' + Math.round
        (( ( new Date().getTime() - time ) / 1000 ) * 100) / 100 + 's</span>';
        status.innerHTML = scoreText;
    }


    // TODO       хендлер для Пробела


    function documentKeyDownHandler(event) {
        switch (event.keyCode) {
            case 32:
                if (!spaceIsDown && myShip.energy > 30) {/*  */
                    myShip.energy -= 1;
                    /* при нажатии уменьшаем чтобы небыло чита */
                }
                spaceIsDown = true;
                event.preventDefault();
                /* останавливаем событие */
                break;
        }
    }

    function documentKeyUpHandler(event) {
        switch (event.keyCode) {
            case 32:
                spaceIsDown = false;
                event.preventDefault();
                /* останавливаем событие */
                break;
        }
    }

    /*  TODO     хендлеры для мыши!!!!!!!!!!!!!!!!!    */


    /**
     * Event handler      for           document.onmousemove.
     */

    /*оставляем 0,5 норм крутит*/
    function documentMouseMoveHandler(event) {
        mouseX = event.clientX - (window.innerWidth - world.width) * 0.5 - BORDER_WIDTH;
        mouseY = event.clientY - (window.innerHeight - world.height) * 0.5 - BORDER_WIDTH;
    }

    /**
     * Event handler     for         document.onmousedown.
     */

    /*не придумал еще*/
    function documentMouseDownHandler(event) {
        mouseIsDown = true;
    }

    /**
     * Event handler for document.onmouseup.
     */

    /*не придумал еще*/
    function documentMouseUpHandler(event) {
        mouseIsDown = false;
    }


    /*TODO   тачи !!! не менять!!!! код не мой хз как работает но работает */

    /**
     * Event handler for document.ontouchstart.
     */
    function documentTouchStartHandler(event) {
        if (event.touches.length == 1) {
            event.preventDefault();

            mouseX = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5;
            mouseY = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5;

            mouseIsDown = true;
        }
    }

    /**
     * Event handler for document.ontouchmove.
     */



    function documentTouchMoveHandler(event) {
        if (event.touches.length == 1) {
            event.preventDefault();

            mouseX = event.touches[0].pageX - (window.innerWidth - world.width) * 0.5 - 60;
            mouseY = event.touches[0].pageY - (window.innerHeight - world.height) * 0.5 - 30;
        }
    }

    /**
     * Event handler for document.ontouchend.
     */
    function documentTouchEndHandler(event) {
        mouseIsDown = false;
    }


    /*TODO ресайз    !!!!!!!!!!!!!!!!!!*/

    /**
     * Event handler for window.onresize.
     */

    /* Ресайз   */
    function windowResizeHandler() {
        //Если мобила
        // Обновляем размер   по VAR  !!!!!!
        world.width = isMobile ? window.innerWidth : DEFAULT_WIDTH;
        world.height = isMobile ? window.innerHeight : DEFAULT_HEIGHT;

        // центрируем наш корабль
        myShip.position.x = world.width * 0.5; // ровно центр
        myShip.position.y = world.height * 0.5; // ровно центр

        // растягиваем канву по миру
        /*можно изменять высоту и ширину умножая на число*/
        canvas.width = world.width;
        /*ширина*/
        canvas.height = world.height;
        /* высота*/
        /* бэк делаем соответственно*/
        canvasBackground.width = world.width;
        canvasBackground.height = world.height;

        // Определите положение x / y на холсте
        //положение самого  игрового экрана
        var centerVx = (window.innerWidth - world.width) * 0.5;
        var centerVy = (window.innerHeight - world.height) * 0.5;

        // Позиция канвы
        canvas.style.position = 'absolute';
        canvas.style.left = centerVx + 'px';
        canvas.style.top = centerVy + 'px';
        canvasBackground.style.position = 'absolute';
        canvasBackground.style.left = centerVx + BORDER_WIDTH + 'px';
        canvasBackground.style.top = centerVy + BORDER_WIDTH + 'px';


        //если мобила - режем рамки к .....********
        if (isMobile) {
            panels.style.left = '0px';
            panels.style.top = '0px';
            status.style.left = '0px';
            status.style.top = '0px';
        }
        else {
            panels.style.left = centerVx + BORDER_WIDTH + 'px';
            panels.style.top = centerVy + 200 + 'px';
            status.style.left = centerVx + BORDER_WIDTH + 'px';
            status.style.top = centerVy + BORDER_WIDTH + 'px';
        }

        renderBackground();
    }

    /**
     * выпускат рандомное количество частиц из заданной точки
     *
     * вычисляем скорость и направление частиц
     *
     *
     */

    /* передаем 4 параметра  ---    позиция направление распространение  и звезды */
    function throwMiniStars(position, direction, extension, stars) {
        /* VAR  внутри - так удобнее чтоб не путать  */
        /* кидаем рандомное количество */
        var miniStars = stars + ( Math.random() * stars );
        /* скорость и направление */
        while (--miniStars >= 0) {
            var particles = new Point();
            particles.position.x = position.x + ( Math.sin(miniStars) * extension );
            particles.position.y = position.y + ( Math.cos(miniStars) * extension );
            particles.velocity = {
                x: direction.x + ( -1 + Math.random() * 2 ),
                y: direction.y + ( -1 + Math.random() * 2 )
            };
            particles.alpha = 1;
            /*           пушим в массив   */
            particlesAfterBoom.push(particles);
        }
    }


    /*TODO     Анимация            z*/
    /**
     *
     * Вызываеться на каждый фрейм для обновления свойств
     *и отображаем текущее состояние на канве
     *
     */
    function animate() {

        // Получить текущее время для этого кадра
        var frameTime = new Date().getTime();

        // инкрементируем кадры
        frames++;

        // Проверяем прошла ли секунда с момента последнего обновления FPS
        if (frameTime > timeLastSecond + 1000) {
            // Установите текущий, минимальный и максимальный FPS
            fps = Math.min(Math.round(( frames * 1000 ) / ( frameTime - timeLastSecond )), FRAMERATE);
            fpsMin = Math.min(fpsMin, fps);
            fpsMax = Math.max(fpsMax, fps);

            timeLastSecond = frameTime;
            frames = 0;
        }

        // Фактор, с помощью которого оценка будет масштабироваться, в зависимости от текущего FPS
        var scoreFactor = 0.01 + ( Math.max(Math.min(fps, FRAMERATE), 0) / FRAMERATE * 0.99 );

        // Фактор с помощью которого оценка будет масштабироваться, в зависимости от текущего FPS
        scoreFactor = scoreFactor * scoreFactor;

        // Полностью чистим канву от всех старых данных пикселей
        context.clearRect(0, 0, canvas.width, canvas.height);


        /*TODO      !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1 разобрать*/


        var i,
            ilen,
            j,
            jlen;


        /*TODO      если игра активна!!!!!!!!!!!!!*/
        // Обновляем свойства игры и рисуем игрока, если игра активна

        if (playing) {

            // Немного ускоряем чтобы усложнить!!!!!
            difficulty += 0.0015;

            // Увеличение счета в зависимости от сложности
            //
            score += (0.4 * difficulty) * scoreFactor;

            // Increase the game frame count stat
            frameCount++;

            // Увеличиваем счетчик кадров игрового фрейма
            frameScore += (0.4 * difficulty) * scoreFactor;

            //player.angle = Math.atan2( mouseY - player.position.y, mouseX - player.position.x );

            var targetAngle = Math.atan2(mouseY - myShip.position.y, mouseX - myShip.position.x);

            if (Math.abs(targetAngle - myShip.angle) > Math.PI) {
                myShip.angle = targetAngle;
            }

            myShip.angle += ( targetAngle - myShip.angle ) * 0.2;

            myShip.energyRadiusTarget = ( myShip.energy / 100 ) * ( myShip.radius * 0.8 );
            myShip.energyRadius += ( myShip.energyRadiusTarget - myShip.energyRadius ) * 0.2;

            /*TODO защита  !!!!*/

            myShip.shield = {
                x: myShip.position.x + Math.cos(myShip.angle)
                * myShip.radius, y: myShip.position.y + Math.sin(myShip.angle) * myShip.radius
            };

            // Защита
            /*TODO не удалять*/

            context.beginPath();

            /*   TODO  обязательно иначе
                 TODO очистка предыдущих скринов не произойдет
                 TODO   и будет вместо круга линия.
                 //знал бы кто сколько я потерял времени чтобы это понять :(
                 печалька
                 */
            context.strokeStyle = '#FFFFFF'; //цвет купола - оставлю белый - хорошо видно
            context.lineWidth = 8; //толщина линии -- больше не делать!!!!

            //делаем полукруг - код не мой
            context.arc(myShip.position.x, myShip.position.y, myShip.radius,
                myShip.angle + 1.8, myShip.angle - 1.8, true); //регулируем размер защиты
            context.stroke();

            // Шар - игрок
            context.beginPath();
            context.fillStyle = "#249d93";
            /*шар*/
            context.strokeStyle = "#3be2d4";
            /*оболочка*/
            context.lineWidth = 3; // толщина линии

            myShip.updateCore();

            var loopedNodes = myShip.shipNodes.concat();
            loopedNodes.push(myShip.shipNodes[0]);

            for (var i = 0; i < loopedNodes.length; i++) {

                var flyingShip = loopedNodes[i];
                var part2 = loopedNodes[i + 1];

                flyingShip.position.x += ( (myShip.position.x + flyingShip.normal.x + flyingShip.offset.x) - flyingShip.position.x ) * 0.2;
                flyingShip.position.y += ( (myShip.position.y + flyingShip.normal.y + flyingShip.offset.y) - flyingShip.position.y ) * 0.2;

                if (i === 0) {
                    // Это первый цикл, поэтому нам нужно начать с позиции
                    context.moveTo(flyingShip.position.x, flyingShip.position.y);
                }
                else if (part2) {
                    // Рисуем кривую между текущей и следующей точкой пути
                    context.quadraticCurveTo(flyingShip.position.x, flyingShip.position.y,
                        flyingShip.position.x + ( part2.position.x - flyingShip.position.x ) / 2,
                        flyingShip.position.y + ( part2.position.y - flyingShip.position.y ) / 2);
                }
            }

            context.closePath();// закрываем путь
            context.fill();//заполняем
            context.stroke();// рисуем фигуру которую задали заранее

        }
        /* TODO       отработка пробела    понижаем энергию!!!!!!!  */
        if (spaceIsDown && myShip.energy > 10) {
            myShip.energy -= 0.1;

            context.beginPath();
            context.fillStyle = 'rgba( 0, 100, 100, ' + ( myShip.energy / 100 ) * 0.9 + ' )';
            //рисуем круг от позиции корабля
            context.arc(myShip.position.x, myShip.position.y, myShip.radius, 0, Math.PI * 2, true);
            context.fill();
        }
        //начальный счетчик чужих

        var enemyCount = 0;
        var energyCount = 0;

        // Проходим  через каждого врага и рисуем его + обновляем  его свойства
        for (i = 0; i < aliens.length; i++) {
            flyingShip = aliens[i];
            //накидываем скорость
            flyingShip.position.x += flyingShip.velocity.x;
            flyingShip.position.y += flyingShip.velocity.y;

            flyingShip.alpha += ( 1 - flyingShip.alpha ) * 0.1;


            if (flyingShip.type == ENEMY_RED) context.fillStyle = 'rgba( 255, 0, 0, ' + flyingShip.alpha + ' )';
            if (flyingShip.type == ENERGY_GREEN) context.fillStyle = 'rgba( 0, 235, 190, ' + flyingShip.alpha + ' )';

            context.beginPath();
            /*
            * TODO    размер наших врагов и энергии
            *
            *    TODO * 1,2 поставил для наглядности но ---- лучше   /2
            *
            * */
            context.arc(flyingShip.position.x, flyingShip.position.y, flyingShip.size / 1.4, 0, Math.PI * 2, true);

            context.fill();

            var angle = Math.atan2(flyingShip.position.y - myShip.position.y, flyingShip.position.x - myShip.position.x);


            if (playing) {

                var dist = Math.abs(angle - myShip.angle);

                if (dist > Math.PI) {
                    dist = ( Math.PI * 2 ) - dist;
                }

                if (dist < 1.6) {
                    if (flyingShip.distanceTo(myShip.position)
                        > myShip.radius - 5 && flyingShip.distanceTo(myShip.position) < myShip.radius + 5) {
                        flyingShip.dead = true;
                    }
                }


                /* TODO счет    */
                if (spaceIsDown && flyingShip.distanceTo(myShip.position) < myShip.radius && myShip.energy > 11) {
                    flyingShip.dead = true;
                    score += 4;
                }

                if (flyingShip.distanceTo(myShip.position) < myShip.energyRadius + (flyingShip.size * 0.5)) {
                    if (flyingShip.type == ENEMY_RED) {
                        myShip.energy -= 6;
                    }

                    if (flyingShip.type == ENERGY_GREEN) {
                        myShip.energy += 8;
                        score += 30;
                    }

                    myShip.energy = Math.max(Math.min(myShip.energy, 100), 0);

                    flyingShip.dead = true;
                }
            }

            // Если шар вылетел убираем его
            if (flyingShip.position.x < -flyingShip.size || flyingShip.position.x > world.width + flyingShip.size
                || flyingShip.position.y < -flyingShip.size || flyingShip.position.y > world.height + flyingShip.size) {
                flyingShip.dead = true;
            }

            // Если шар разбился убираем его
            if (flyingShip.dead) {
                throwMiniStars(flyingShip.position, {
                    x: (flyingShip.position.x - myShip.position.x) * 0.02,
                    y: (flyingShip.position.y - myShip.position.y) * 0.02
                }, 5, 5);

                aliens.splice(i, 1); // удаляем первый элемент из нашего массива
                i--;
            }
            else {
                if (flyingShip.type === ENEMY_RED) enemyCount++;
                if (flyingShip.type === ENERGY_GREEN) energyCount++;
            }
        }

        // Если меньше чужих чем положено по сложности - добавляем еще
        if (enemyCount < 1 * difficulty && new Date().getTime() - lastspawn > 100) {
            aliens.push(giveLife(new Enemy())); // тупо пушим в массив
            lastspawn = new Date().getTime();
        }

        //
        if (energyCount < 1 && Math.random() > 0.996) {
            aliens.push(giveLife(new Energy()));
        }

        // проходим циклом и рисуем частицы
        for (i = 0; i < particlesAfterBoom.length; i++) {
            flyingShip = particlesAfterBoom[i];

            // применяем скорость к частицам
            flyingShip.position.x += flyingShip.velocity.x;
            flyingShip.position.y += flyingShip.velocity.y;

            // исчезание
            flyingShip.alpha -= 0.002; // делаем поменьше чтобы долетали до краев экрана !!! так красивее

            // Рисуем частицы
            context.fillStyle = 'rgba(255,255,255,' + Math.max(flyingShip.alpha, 0) + ')';
            context.fillRect(flyingShip.position.x, flyingShip.position.y, 1, 1);

            // Если частица исчезает , удалztv
            if (flyingShip.alpha <= 0) {
                particlesAfterBoom.splice(i, 1); // из массива
            }
        }
        /*TODO     -------------    обновление счета   */


        // Если игра активна обновляем строку состояния игры со счетом, продолжительностью и FPS
        if (playing) {
            var scoreText = 'Итоговый счет: <span>' + Math.round(score) + '</span>';
            scoreText += ' Время в игре: <span>'
                + Math.round(( ( new Date().getTime() - time ) / 1000 ) * 100) / 100 + 's</span>';
            scoreText += ' <p class="fps">ФПС: <span>'
                + Math.round(fps) + ' (' + Math.round(Math.max(Math.min(fps / FRAMERATE, FRAMERATE), 0) * 100) + '%)</span></p>';
            status.innerHTML = scoreText;
            /*  TODO   ----------        если гамовер то гамовер   */
            if (myShip.energy === 0) {
                throwMiniStars(myShip.position, {x: 0, y: 0}, 10, 40);

                gameOver();
            }
        }

        requestAnimFrame(animate);
    }

    /**
     *
     */


    function giveLife(organism) {
        var side = Math.round(Math.random() * 3);

        switch (side) {
            case 0:
                organism.position.x = 10;
                organism.position.y = world.height * Math.random();
                break;
            case 1:
                organism.position.x = world.width * Math.random();
                organism.position.y = 10;
                break;
            case 2:
                organism.position.x = world.width - 10;
                organism.position.y = world.height * Math.random();
                break;
            case 3:
                organism.position.x = world.width * Math.random();
                organism.position.y = world.height - 10;
                break;
        }

        organism.speed = Math.min(Math.max(Math.random(), 0.6), 0.75);

        organism.velocity.x = ( myShip.position.x - organism.position.x ) * 0.006 * organism.speed;
        organism.velocity.y = ( myShip.position.y - organism.position.y ) * 0.006 * organism.speed;

        if (organism.type == 'enemy') {
            organism.velocity.x *= (1 + (Math.random() * 0.1));
            organism.velocity.y *= (1 + (Math.random() * 0.1));
        }

        organism.alpha = 0;

        return organism;
    }

};

function Point(x, y) {
    this.position = {x: x, y: y};
}

Point.prototype.distanceTo = function (p) {
    var dx = p.x - this.position.x;
    var dy = p.y - this.position.y;
    return Math.sqrt(dx * dx + dy * dy);
};
Point.prototype.clonePosition = function () {
    return {x: this.position.x, y: this.position.y};
};

function Player() {
    this.position = {x: 0, y: 0};
    this.length = 15;
    this.energy = 30;
    this.energyRadius = 0;
    this.energyRadiusTarget = 0;
    this.radius = 60;
    this.angle = 0;
    this.shipQuality = 16;
    this.shipNodes = [];
}

Player.prototype = new Point();
Player.prototype.updateCore = function () {
    var i, j, n;

    if (this.shipNodes.length == 0) {
        var i, n;

        for (i = 0; i < this.shipQuality; i++) {
            n = {
                position: {x: this.position.x, y: this.position.y},
                normal: {x: 0, y: 0},
                normalTarget: {x: 0, y: 0},
                offset: {x: 0, y: 0}
            };

            this.shipNodes.push(n);
        }
    }

    for (i = 0; i < this.shipQuality; i++) {

        var n = this.shipNodes[i];

        var angle = ( i / this.shipQuality ) * Math.PI * 2;

        n.normal.x = Math.cos(angle) * this.energyRadius;
        n.normal.y = Math.sin(angle) * this.energyRadius;

        n.offset.x = Math.random() * 5;
        n.offset.y = Math.random() * 5;
    }
};


/*  TODO   ---------   описание чужих размеры     */
function Enemy() {
    this.position = {x: 0, y: 0};
    this.velocity = {x: 0, y: 0};

    /*размер шара*/
    this.size = 10 + ( Math.random() * 4 );
    /*размер шара*/


    this.speed = 1;
    /*скорость*/


    this.type = 'enemy';
}

Enemy.prototype = new Point();

function Energy() {
    this.position = {x: 0, y: 0};
    this.velocity = {x: 0, y: 0};
    this.size = 20 + ( Math.random() * 6 );
    /*размер шара*/
    this.speed = 1;
    /*скорость*/
    this.type = 'energy';
}

Energy.prototype = new Point();


/*  TODO    не менять не трогать !!!!!!!!!!!!!!!    оно сработало!!!!!!!!!!!!!!!*/

// скопировал с  setTimeout fallback from http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();


// ура

superMegaGame.init();