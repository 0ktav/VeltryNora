export type Lang = 'en' | 'ro' | 'ru';

export const translations = {
  en: {
    nav: {
      download: 'Download',
      github: 'GitHub',
      changelog: 'Changelog',
    },
    hero: {
      tagline: 'Nginx, PHP, MySQL, Redis — running in minutes.',
      subtitle:
        'Manage your entire local development stack from one interface. No terminal required.',
      downloadBtn: 'Download for Windows',
      githubBtn: 'View on GitHub',
      version: 'Latest version',
      free: 'Free & Open Source',
    },
    features: {
      title: 'All you need',
      items: [
        {
          icon: 'nginx',
          name: 'Nginx',
          desc: 'Install, switch versions, start/stop/restart/reload.',
        },
        {
          icon: 'php',
          name: 'PHP',
          desc: 'Multiple versions side by side. Manage extensions and php.ini.',
        },
        {
          icon: 'mysql',
          name: 'MySQL',
          desc: 'Manage databases and users. Import/export SQL dumps.',
        },
        {
          icon: 'redis',
          name: 'Redis',
          desc: 'Install and run commands interactively from the UI.',
        },
        {
          icon: 'sites',
          name: 'Virtual Sites',
          desc: 'Custom local domains, PHP version and public root per site, hosts file managed automatically.',
        },
        {
          icon: 'laravel',
          name: 'Laravel',
          desc: 'Auto-detect projects, run artisan commands, upgrade the framework.',
        },
        {
          icon: 'update',
          name: 'Auto-update',
          desc: 'Checks for new versions on startup. One click to update.',
        },
        {
          icon: 'tools',
          name: 'Dev Tools',
          desc: 'Portable Git, Node.js and Composer — no system install needed.',
        },
      ],
    },
    why: {
      title: 'Built for developers, not for profit',
      items: [
        {
          icon: 'opensource',
          title: 'Open Source',
          desc: 'Full source code on GitHub. MIT license. Fork it, audit it, contribute.',
        },
        {
          icon: 'privacy',
          title: 'Zero telemetry',
          desc: 'No data collected. No accounts, no ads, no tracking. Ever.',
        },
        {
          icon: 'windows',
          title: 'Windows-native',
          desc: 'System tray, toast notifications, single-instance enforcement.',
        },
        {
          icon: 'active',
          title: 'Actively maintained',
          desc: 'Regular releases with new features and fixes. Feedback welcome.',
        },
      ],
    },
    settings: {
      title: 'Configurable your way',
      subtitle: 'Everything adjustable — no digging through config files.',
      missing: 'Something missing?',
      missingLink: 'Open an issue →',
      items: [
        { icon: 'folder',  label: 'Custom install path' },
        { icon: 'play',    label: 'Auto-start services on open' },
        { icon: 'stop',    label: 'Auto-stop services on close' },
        { icon: 'power',   label: 'Start on Windows boot' },
        { icon: 'theme',   label: 'Dark / Light theme' },
        { icon: 'globe',   label: 'Language — EN / RO / RU' },
        { icon: 'cpu',     label: 'Nginx workers' },
        { icon: 'clock',   label: 'Nginx keepalive' },
        { icon: 'tray',    label: 'Minimize to tray' },
        { icon: 'log',     label: 'App log' },
        { icon: 'browser', label: 'Preferred browser' },
        { icon: 'bell',    label: 'Notify on service crash' },
        { icon: 'alert',   label: 'Notify on operation fail' },
        { icon: 'tabs',    label: 'Tabs layout for service pages' },
      ],
    },
    changelog: {
      title: 'Changelog',
    },
    footer: {
      license: 'Free and open source. MIT License.',
      madeWith: 'Made with care for the developer community.',
    },
  },

  ro: {
    nav: {
      download: 'Descarcă',
      github: 'GitHub',
      changelog: 'Versiuni',
    },
    hero: {
      tagline: 'Nginx, PHP, MySQL, Redis — gata în câteva minute.',
      subtitle:
        'Gestionează întreg stack-ul tău de dezvoltare local dintr-o singură interfață. Fără terminal.',
      downloadBtn: 'Descarcă pentru Windows',
      githubBtn: 'Vezi pe GitHub',
      version: 'Ultima versiune',
      free: 'Gratuit & Open Source',
    },
    features: {
      title: 'Totul de ce ai nevoie',
      items: [
        {
          icon: 'nginx',
          name: 'Nginx',
          desc: 'Instalare, schimbare versiune, pornire/oprire/restart/reload.',
        },
        {
          icon: 'php',
          name: 'PHP',
          desc: 'Mai multe versiuni simultan. Gestionezi extensii și php.ini.',
        },
        {
          icon: 'mysql',
          name: 'MySQL',
          desc: 'Baze de date și utilizatori. Import/export dump-uri SQL.',
        },
        {
          icon: 'redis',
          name: 'Redis',
          desc: 'Instalare și rulare comenzi direct din interfață.',
        },
        {
          icon: 'sites',
          name: 'Site-uri virtuale',
          desc: 'Domenii locale custom, versiune PHP și cale publică per site, hosts gestionat automat.',
        },
        {
          icon: 'laravel',
          name: 'Laravel',
          desc: 'Detectare automată proiecte, comenzi artisan, upgrade framework.',
        },
        {
          icon: 'update',
          name: 'Actualizare automată',
          desc: 'Verifică versiuni noi la pornire. Un singur click pentru actualizare.',
        },
        {
          icon: 'tools',
          name: 'Unelte Dev',
          desc: 'Git, Node.js și Composer portabile — fără instalare în sistem.',
        },
      ],
    },
    why: {
      title: 'Construit pentru tine, nu pentru profit',
      items: [
        {
          icon: 'opensource',
          title: 'Open Source',
          desc: 'Cod sursă complet pe GitHub. Licență MIT. Poți audita, fork-ui, contribui.',
        },
        {
          icon: 'privacy',
          title: 'Zero telemetrie',
          desc: 'Nicio dată colectată. Niciun cont, nicio reclamă, nicio urmărire.',
        },
        {
          icon: 'windows',
          title: 'Nativ pe Windows',
          desc: 'System tray, notificări toast, instanță unică.',
        },
        {
          icon: 'active',
          title: 'Activ menținut',
          desc: 'Versiuni regulate cu funcționalități noi și corecturi. Feedback binevenit.',
        },
      ],
    },
    settings: {
      title: 'Configurabil după bunul tău plac',
      subtitle: 'Tot ce contează e reglabil — fără să umbli prin fișiere de config.',
      missing: 'Lipsește ceva?',
      missingLink: 'Deschide un issue →',
      items: [
        { icon: 'folder',  label: 'Cale de instalare personalizată' },
        { icon: 'play',    label: 'Pornire automată servicii la deschidere' },
        { icon: 'stop',    label: 'Oprire automată servicii la închidere' },
        { icon: 'power',   label: 'Pornire automată la boot Windows' },
        { icon: 'theme',   label: 'Temă Dark / Light' },
        { icon: 'globe',   label: 'Limbă — EN / RO / RU' },
        { icon: 'cpu',     label: 'Nginx workers' },
        { icon: 'clock',   label: 'Nginx keepalive' },
        { icon: 'tray',    label: 'Minimizare în tray' },
        { icon: 'log',     label: 'Jurnal aplicație' },
        { icon: 'browser', label: 'Browser preferat' },
        { icon: 'bell',    label: 'Notificare la crash serviciu' },
        { icon: 'alert',   label: 'Notificare la eroare operație' },
        { icon: 'tabs',    label: 'Layout cu file pentru pagini servicii' },
      ],
    },
    changelog: {
      title: 'Versiuni',
    },
    footer: {
      license: 'Gratuit și open source. Licență MIT.',
      madeWith: 'Creat cu grijă pentru comunitatea de dezvoltatori.',
    },
  },

  ru: {
    nav: {
      download: 'Скачать',
      github: 'GitHub',
      changelog: 'Версии',
    },
    hero: {
      tagline: 'Nginx, PHP, MySQL, Redis — запустите за минуты.',
      subtitle:
        'Управляйте всем локальным стеком разработки из одного интерфейса. Без терминала.',
      downloadBtn: 'Скачать для Windows',
      githubBtn: 'Смотреть на GitHub',
      version: 'Последняя версия',
      free: 'Бесплатно и Open Source',
    },
    features: {
      title: 'Всё что нужно',
      items: [
        {
          icon: 'nginx',
          name: 'Nginx',
          desc: 'Установка, смена версий, запуск/остановка/перезапуск/перезагрузка.',
        },
        {
          icon: 'php',
          name: 'PHP',
          desc: 'Несколько версий одновременно. Управление расширениями и php.ini.',
        },
        {
          icon: 'mysql',
          name: 'MySQL',
          desc: 'Управление базами данных и пользователями. Импорт/экспорт SQL.',
        },
        {
          icon: 'redis',
          name: 'Redis',
          desc: 'Установка и выполнение команд прямо из интерфейса.',
        },
        {
          icon: 'sites',
          name: 'Виртуальные сайты',
          desc: 'Локальные домены, версия PHP и публичный путь для каждого сайта, hosts управляется автоматически.',
        },
        {
          icon: 'laravel',
          name: 'Laravel',
          desc: 'Автоопределение проектов, команды artisan, обновление фреймворка.',
        },
        {
          icon: 'update',
          name: 'Автообновление',
          desc: 'Проверяет новые версии при запуске. Один клик для обновления.',
        },
        {
          icon: 'tools',
          name: 'Инструменты',
          desc: 'Портативные Git, Node.js и Composer — установка в систему не нужна.',
        },
      ],
    },
    why: {
      title: 'Создано для вас, не ради прибыли',
      items: [
        {
          icon: 'opensource',
          title: 'Open Source',
          desc: 'Полный исходный код на GitHub. Лицензия MIT. Форкайте, аудируйте, вносите вклад.',
        },
        {
          icon: 'privacy',
          title: 'Нулевая телеметрия',
          desc: 'Никаких данных. Никаких аккаунтов, рекламы, слежки.',
        },
        {
          icon: 'windows',
          title: 'Нативно для Windows',
          desc: 'Системный трей, toast-уведомления, защита от дублирующего запуска.',
        },
        {
          icon: 'active',
          title: 'Активная разработка',
          desc: 'Регулярные релизы с новыми функциями и исправлениями. Обратная связь приветствуется.',
        },
      ],
    },
    settings: {
      title: 'Настраивайте под себя',
      subtitle: 'Всё регулируется — без правки конфигурационных файлов вручную.',
      missing: 'Чего-то не хватает?',
      missingLink: 'Открыть issue →',
      items: [
        { icon: 'folder',  label: 'Путь установки' },
        { icon: 'play',    label: 'Автозапуск сервисов при открытии' },
        { icon: 'stop',    label: 'Автоостановка сервисов при закрытии' },
        { icon: 'power',   label: 'Запуск при старте Windows' },
        { icon: 'theme',   label: 'Тёмная / светлая тема' },
        { icon: 'globe',   label: 'Язык — EN / RO / RU' },
        { icon: 'cpu',     label: 'Nginx workers' },
        { icon: 'clock',   label: 'Nginx keepalive' },
        { icon: 'tray',    label: 'Свернуть в трей' },
        { icon: 'log',     label: 'Журнал приложения' },
        { icon: 'browser', label: 'Предпочитаемый браузер' },
        { icon: 'bell',    label: 'Уведомление при сбое сервиса' },
        { icon: 'alert',   label: 'Уведомление при ошибке операции' },
        { icon: 'tabs',    label: 'Layout с вкладками для страниц сервисов' },
      ],
    },
    changelog: {
      title: 'История версий',
    },
    footer: {
      license: 'Бесплатно и с открытым исходным кодом. Лицензия MIT.',
      madeWith: 'Создано с заботой о сообществе разработчиков.',
    },
  },
} as const;

export function t(lang: Lang) {
  return translations[lang];
}
