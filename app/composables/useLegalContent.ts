export interface LegalSection {
  title: string
  paragraphs: string[]
  list?: string[]
}

const SUPPORT_EMAIL = 'bcjj.ru@gmail.com'
const SITE = 'https://pixmomento.com'
const UPDATED = '11 августа 2026 г.'

export function useLegalContent() {
  const { locale } = useI18n()
  const lang = computed(() => (locale.value === 'en' ? 'en' : 'ru'))

  const support = computed(() => {
    if (lang.value === 'en') {
      return {
        title: 'Customer support',
        updated: 'August 11, 2026',
        intro: 'PixMomento helps athletes find and purchase tournament photos. If you have questions about an order, download, or using the site — contact us.',
        sections: [
          {
            title: 'Contact',
            paragraphs: [
              `Email: ${SUPPORT_EMAIL}`,
              'We typically respond within 1–2 business days.',
            ],
          },
          {
            title: 'What we can help with',
            paragraphs: [],
            list: [
              'Finding photos on the site (search by tournament, name, or face)',
              'Order status and download links after purchase',
              'Payment issues shown on your bank statement (charges appear as PixMomento / Stripe)',
              'Account, email verification, and login',
              'Requests from photographers and event organizers',
              'T-shirt / print orders submitted through the site',
            ],
          },
          {
            title: 'For faster support, please include',
            paragraphs: [],
            list: [
              'Your order email address',
              'Tournament name and date (if applicable)',
              'Order ID or approximate purchase date',
              'A short description of the issue and screenshots if helpful',
            ],
          },
          {
            title: 'Related documents',
            paragraphs: [
              `Privacy policy: ${SITE}/privacy`,
              `Terms of service: ${SITE}/terms`,
            ],
          },
        ] satisfies LegalSection[],
      }
    }

    return {
      title: 'Поддержка',
      updated: UPDATED,
      intro: 'PixMomento помогает спортсменам находить и покупать фотографии с турниров. Если у вас вопрос по заказу, скачиванию или работе сайта — напишите нам.',
      sections: [
        {
          title: 'Контакты',
          paragraphs: [
            `Email: ${SUPPORT_EMAIL}`,
            'Обычно отвечаем в течение 1–2 рабочих дней.',
          ],
        },
        {
          title: 'С чем поможем',
          paragraphs: [],
          list: [
            'Поиск фото на сайте (по турниру, имени или лицу)',
            'Статус заказа и ссылки на скачивание после оплаты',
            'Вопросы по оплате и списаниям (платёж проходит через Stripe)',
            'Аккаунт, подтверждение email и вход',
            'Заявки от фотографов и организаторов',
            'Заказ футболок и принтов через форму на сайте',
          ],
        },
        {
          title: 'Чтобы мы быстрее помогли, укажите',
          paragraphs: [],
          list: [
            'Email, указанный при покупке',
            'Название и дату турнира (если применимо)',
            'Номер заказа или дату покупки',
            'Краткое описание проблемы и скриншоты при необходимости',
          ],
        },
        {
          title: 'Документы',
          paragraphs: [
            `Политика конфиденциальности: ${SITE}/privacy`,
            `Условия использования: ${SITE}/terms`,
          ],
        },
      ] satisfies LegalSection[],
    }
  })

  const privacy = computed(() => {
    if (lang.value === 'en') {
      return {
        title: 'Privacy policy',
        updated: 'August 11, 2026',
        intro: 'This policy describes how PixMomento (“we”, pixmomento.com) collects, uses, and protects personal information when you use our website and services.',
        sections: [
          {
            title: '1. Data controller',
            paragraphs: [
              'PixMomento operates the platform at pixmomento.com.',
              `For privacy inquiries contact: ${SUPPORT_EMAIL}`,
            ],
          },
          {
            title: '2. Information we collect',
            paragraphs: ['We may collect the following categories of data:'],
            list: [
              'Account data: name, email, password hash, language preference, optional profile fields (e.g. belt)',
              'Order data: purchased items, tournament, amounts, payment status, guest email for checkout without registration',
              'Usage data: pages viewed, search queries (tournament/name), favorites stored in your account or browser',
              'Face search: a selfie you upload is processed in memory to find matching photos. We do not store the selfie file on disk or in cloud storage',
              'Face search metadata: session identifiers, match results, and timestamps may be stored to provide the service and prevent abuse',
              'Photographer/event leads: data submitted through contact forms (name, email, phone, message)',
              'Technical data: IP address, browser type, device information, cookies and local storage tokens for authentication and cart',
            ],
          },
          {
            title: '3. How we use information',
            paragraphs: [],
            list: [
              'Provide photo search, gallery, cart, and checkout',
              'Process payments through Stripe and deliver download links by email',
              'Run face matching using AWS Rekognition on tournament photo indexes',
              'Maintain your account, favorites, and order history',
              'Respond to support requests and manual merchandise orders',
              'Secure the platform, prevent fraud, and comply with legal obligations',
            ],
          },
          {
            title: '4. Photo visibility & consent',
            paragraphs: [
              'Tournament photos are stored on our servers but are not shown on the public site until you give explicit consent through face search.',
              'When you use face search, you must check a consent box confirming you are searching for your own photos. Only then will matching previews (with watermarks) be shown to you.',
              'After you purchase and download an original, watermarked previews of those photos may remain visible in the tournament catalog for other buyers. Original files are never available without payment.',
              'You may hide your photos from the public catalog or revoke consent entirely in account Settings. Revocation does not delete files from our servers but removes your access and public visibility.',
            ],
          },
          {
            title: '5. Face search & biometric data',
            paragraphs: [
              'When you use face search, you upload a photo containing your face. The image is transmitted securely to our servers, analyzed in memory, and compared against indexed faces from the selected tournament.',
              'We do not persistently store your selfie. AWS Rekognition compares faces without retaining the uploaded selfie for future use.',
              'Indexed face data derived from tournament photos is used solely to enable search within that event. When photos are removed, associated face index entries are deleted.',
              'By using face search you confirm you are searching for photos of yourself or have permission from the person pictured.',
            ],
          },
          {
            title: '6. Sharing & processors',
            paragraphs: ['We share data only as needed to operate the service:'],
            list: [
              'Stripe — payment processing (card data is handled directly by Stripe)',
              'Amazon Web Services (S3, Rekognition) — photo storage and face matching',
              'Resend or similar — transactional email (order confirmations, verification)',
              'Cloudflare — CDN, security, and DDoS protection',
              'Hosting provider — application and database hosting',
            ],
          },
          {
            title: '7. Retention',
            paragraphs: [],
            list: [
              'Account and order records — while your account exists and as required for tax/accounting laws',
              'Guest order records — linked to email for download and support',
              'Selfie uploads — not retained after the search request completes',
              'Server logs — limited retention for security and debugging',
            ],
          },
          {
            title: '8. Your rights',
            paragraphs: [
              'Depending on your jurisdiction you may request access, correction, deletion, or restriction of your personal data.',
              `Contact ${SUPPORT_EMAIL} to exercise these rights. We may ask you to verify your identity.`,
            ],
          },
          {
            title: '9. Security',
            paragraphs: [
              'We use HTTPS, access controls, hashed passwords, and industry-standard practices to protect data. No method of transmission over the Internet is 100% secure.',
            ],
          },
          {
            title: '10. Children',
            paragraphs: [
              'Photos may include minors at sporting events. Accounts are intended for users 16+ or with parental consent. Parents may contact us regarding a child’s data.',
            ],
          },
          {
            title: '11. Changes',
            paragraphs: [
              'We may update this policy. The “last updated” date at the top will change. Continued use of the site after changes constitutes acceptance.',
            ],
          },
        ] satisfies LegalSection[],
      }
    }

    return {
      title: 'Политика конфиденциальности',
      updated: UPDATED,
      intro: 'Настоящая политика описывает, как PixMomento («мы», pixmomento.com) собирает, использует и защищает персональные данные при использовании сайта и сервисов.',
      sections: [
        {
          title: '1. Оператор данных',
          paragraphs: [
            'PixMomento управляет платформой на домене pixmomento.com.',
            `По вопросам конфиденциальности: ${SUPPORT_EMAIL}`,
          ],
        },
        {
          title: '2. Какие данные мы собираем',
          paragraphs: ['Мы можем обрабатывать следующие категории данных:'],
          list: [
            'Данные аккаунта: имя, email, хеш пароля, язык, необязательные поля профиля (например, пояс)',
            'Данные заказов: купленные позиции, турнир, суммы, статус оплаты, email гостя при покупке без регистрации',
            'Данные использования: просмотренные страницы, поисковые запросы (турнир/имя), избранное в аккаунте или браузере',
            'Поиск по лицу: загруженное селфи обрабатывается в памяти для поиска совпадений. Файл селфи не сохраняется на диске и не загружается в облачное хранилище',
            'Метаданные поиска по лицу: идентификаторы сессии, результаты совпадений и время запроса могут сохраняться для работы сервиса и защиты от злоупотреблений',
            'Заявки фотографов и мероприятий: данные из форм (имя, email, телефон, сообщение)',
            'Технические данные: IP-адрес, тип браузера, информация об устройстве, cookies и localStorage для авторизации и корзины',
          ],
        },
        {
          title: '3. Цели обработки',
          paragraphs: [],
          list: [
            'Поиск фото, галерея, корзина и оформление заказа',
            'Приём платежей через Stripe и отправка ссылок на скачивание по email',
            'Сопоставление лиц с помощью AWS Rekognition по индексу фото турнира',
            'Ведение аккаунта, избранного и истории покупок',
            'Ответы на обращения в поддержку и ручная обработка заказов мерча',
            'Безопасность платформы, предотвращение мошенничества, исполнение законных обязанностей',
          ],
        },
          {
            title: '4. Видимость фото и согласие',
            paragraphs: [
              'Фото с турниров хранятся на наших серверах, но не показываются на сайте, пока вы явно не дадите согласие через поиск по лицу.',
              'При поиске по лицу необходимо отметить галочку согласия — только после этого вам будут показаны совпадения (превью с водяным знаком).',
              'После покупки и скачивания оригинала превью с водяным знаком могут оставаться в каталоге турнира для других покупателей. Оригинал без оплаты недоступен.',
              'В настройках аккаунта можно скрыть фото из публичного каталога или полностью отозвать согласие. Отзыв не удаляет файлы с сервера, но убирает доступ и публичную видимость.',
            ],
          },
        {
          title: '5. Поиск по лицу и биометрические данные',
          paragraphs: [
            'При поиске по лицу вы загружаете фото с вашим лицом. Изображение передаётся на наши серверы по защищённому соединению, анализируется в памяти и сравнивается с проиндексированными лицами на выбранном турнире.',
            'Мы не храним селфи после завершения запроса. AWS Rekognition выполняет сравнение без сохранения загруженного селфи для дальнейшего использования.',
            'Индексированные данные лиц из фото турнира используются только для поиска в рамках этого мероприятия. При удалении фото связанные записи индекса удаляются.',
            'Используя поиск по лицу, вы подтверждаете, что ищете фото себя или имеете согласие изображённого человека.',
          ],
        },
        {
          title: '6. Передача данных третьим лицам',
          paragraphs: ['Мы передаём данные только для работы сервиса:'],
          list: [
            'Stripe — обработка платежей (данные карты обрабатываются напрямую Stripe)',
            'Amazon Web Services (S3, Rekognition) — хранение фото и сопоставление лиц',
            'Resend или аналог — транзакционные письма (подтверждение заказа, верификация email)',
            'Cloudflare — CDN, безопасность и защита от DDoS',
            'Хостинг-провайдер — размещение приложения и базы данных',
          ],
        },
        {
          title: '7. Срок хранения',
          paragraphs: [],
          list: [
            'Данные аккаунта и заказов — пока существует аккаунт и в сроки, требуемые законом',
            'Заказы гостей — привязаны к email для скачивания и поддержки',
            'Селфи для поиска — не сохраняются после завершения запроса',
            'Серверные логи — ограниченный срок для безопасности и отладки',
          ],
        },
        {
          title: '8. Ваши права',
          paragraphs: [
            'Вы можете запросить доступ, исправление, удаление или ограничение обработки персональных данных в пределах применимого законодательства.',
            `Напишите на ${SUPPORT_EMAIL}. Мы можем попросить подтвердить личность.`,
          ],
        },
        {
          title: '9. Безопасность',
          paragraphs: [
            'Мы используем HTTPS, контроль доступа, хеширование паролей и общепринятые меры защиты. Абсолютной безопасности передачи данных в интернете не существует.',
          ],
        },
        {
          title: '10. Дети',
          paragraphs: [
            'На фото могут быть несовершеннолетние участники турниров. Аккаунты предназначены для пользователей от 16 лет или с согласия родителей. Родители могут обратиться к нам по данным ребёнка.',
          ],
        },
        {
          title: '11. Изменения политики',
          paragraphs: [
            'Мы можем обновлять политику. Дата «последнего обновления» указана в начале документа. Продолжение использования сайта означает согласие с актуальной версией.',
          ],
        },
      ] satisfies LegalSection[],
    }
  })

  const terms = computed(() => {
    if (lang.value === 'en') {
      return {
        title: 'Terms of service',
        updated: 'August 11, 2026',
        intro: 'These terms govern your use of PixMomento at pixmomento.com. By using the site or purchasing photos you agree to these terms.',
        sections: [
          {
            title: '1. Service',
            paragraphs: [
              'PixMomento is an online platform to browse, search, and purchase digital photos from BJJ and martial arts tournaments. Registration is optional; guest checkout with email is available.',
            ],
          },
          {
            title: '2. Photo license',
            paragraphs: [],
            list: [
              'Purchased photos are licensed for personal, non-commercial use unless otherwise agreed in writing',
              'You may not resell, redistribute, or sublicense photos without permission from the rights holder',
              'Watermarked previews are not licensed for use until purchased',
              'Copyright remains with the photographer or organizer; your purchase grants a limited usage license',
            ],
          },
          {
            title: '3. Pricing & payment',
            paragraphs: [
              'Prices are shown in USD (or as displayed on the tournament page). Payment is processed by Stripe. You must provide a valid email to receive download links.',
              'We reserve the right to correct pricing errors before order confirmation.',
            ],
          },
          {
            title: '4. Digital goods & refunds',
            paragraphs: [
              'Photos are digital goods delivered electronically after successful payment. Because files can be copied instantly, refunds are generally not available once download access is granted, except where required by law or in case of technical failure on our side.',
              `For billing disputes contact ${SUPPORT_EMAIL} within 14 days of purchase.`,
            ],
          },
          {
            title: '5. Face search',
            paragraphs: [
              'Face search is provided as a convenience tool. Results may not be complete or 100% accurate. You agree to upload only photos you have the right to use for identification purposes.',
            ],
          },
          {
            title: '6. User conduct',
            paragraphs: [],
            list: [
              'Do not attempt to bypass watermarks, scrape bulk content, or attack the service',
              'Do not upload unlawful, offensive, or third-party content without permission',
              'Photographers must only upload content they have rights to distribute',
            ],
          },
          {
            title: '7. Photographers',
            paragraphs: [
              'Photographers must confirm they have the legal right to shoot at the event and to distribute uploaded photos through PixMomento.',
              'By uploading, you represent that you hold necessary rights and accept responsibility for your content. PixMomento may moderate or remove content but does not verify each upload.',
              'You agree to indemnify PixMomento against claims arising from your uploads to the extent permitted by law.',
            ],
          },
          {
            title: '8. Merchandise requests',
            paragraphs: [
              'T-shirt and print orders submitted through the site are processed manually. Separate confirmation, pricing, and delivery terms will be communicated by email.',
            ],
          },
          {
            title: '9. Disclaimer',
            paragraphs: [
              'The service is provided “as is”. We do not guarantee uninterrupted availability. To the maximum extent permitted by law, PixMomento is not liable for indirect or consequential damages.',
            ],
          },
          {
            title: '10. Changes & contact',
            paragraphs: [
              'We may update these terms. Material changes will be reflected on this page.',
              `Support: ${SUPPORT_EMAIL} · ${SITE}/support`,
            ],
          },
        ] satisfies LegalSection[],
      }
    }

    return {
      title: 'Условия использования',
      updated: UPDATED,
      intro: 'Настоящие условия регулируют использование PixMomento на pixmomento.com. Используя сайт или покупая фото, вы соглашаетесь с этими условиями.',
      sections: [
        {
          title: '1. Описание сервиса',
          paragraphs: [
            'PixMomento — онлайн-платформа для просмотра, поиска и покупки цифровых фотографий с турниров по BJJ и другим единоборствам. Регистрация необязательна; доступна покупка по email без аккаунта.',
          ],
        },
        {
          title: '2. Лицензия на фото',
          paragraphs: [],
          list: [
            'Купленные фото предоставляются для личного некоммерческого использования, если не согласовано иное',
            'Запрещена перепродажа, массовое распространение или сублицензирование без согласия правообладателя',
            'Превью с водяными знаками не предназначены для использования до покупки',
            'Авторские права остаются у фотографа или организатора; покупка даёт ограниченную лицензию на использование',
          ],
        },
        {
          title: '3. Цены и оплата',
          paragraphs: [
            'Цены указаны в USD (или как показано на странице турнира). Оплата проходит через Stripe. Укажите корректный email для получения ссылок на скачивание.',
            'Мы вправе исправить ошибку в цене до подтверждения заказа.',
          ],
        },
        {
          title: '4. Цифровые товары и возвраты',
          paragraphs: [
            'Фото — цифровой товар, доставляется электронно после успешной оплаты. После выдачи доступа к скачиванию возврат, как правило, не производится, кроме случаев, предусмотренных законом, или технической ошибки с нашей стороны.',
            `По спорным списаниям пишите на ${SUPPORT_EMAIL} в течение 14 дней с момента покупки.`,
          ],
        },
        {
          title: '5. Поиск по лицу',
          paragraphs: [
            'Поиск по лицу — вспомогательный инструмент. Результаты могут быть неполными или неточными. Загружайте только те фото, которые имеете право использовать для идентификации.',
          ],
        },
        {
          title: '6. Правила поведения',
          paragraphs: [],
          list: [
            'Не обходите водяные знаки, не выгружайте контент массово и не атакуйте сервис',
            'Не загружайте незаконный, оскорбительный контент или данные третьих лиц без разрешения',
            'Фотографы загружают только контент, на распространение которого у них есть права',
          ],
        },
        {
          title: '7. Фотографы',
          paragraphs: [
            'Перед загрузкой фотограф подтверждает право снимать на мероприятии и право распространять материалы через PixMomento.',
            'Загружая контент, вы заявляете о наличии необходимых прав и несёте ответственность за материалы. PixMomento может модерировать или удалять контент, но не проверяет каждую загрузку.',
            'Вы соглашаетесь возмещать претензии, связанные с вашими загрузками, в пределах, допустимых законом.',
          ],
        },
        {
          title: '8. Заказ мерча',
          paragraphs: [
            'Заявки на футболки и принты обрабатываются вручную. Условия, цена и доставка согласуются отдельно по email.',
          ],
        },
        {
          title: '9. Ограничение ответственности',
          paragraphs: [
            'Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу. В пределах, допустимых законом, PixMomento не несёт ответственности за косвенные убытки.',
          ],
        },
        {
          title: '10. Изменения и контакты',
          paragraphs: [
            'Мы можем обновлять условия. Актуальная версия публикуется на этой странице.',
            `Поддержка: ${SUPPORT_EMAIL} · ${SITE}/support`,
          ],
        },
      ] satisfies LegalSection[],
    }
  })

  return { support, privacy, terms }
}
