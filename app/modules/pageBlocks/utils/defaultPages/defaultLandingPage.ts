import { TFunction } from "i18next";
import { PageBlockDto } from "~/modules/pageBlocks/dtos/PageBlockDto";
import { defaultFooter } from "../defaultFooter";
import { defaultHeader } from "../defaultHeader";

export function defaultLandingPage({ t }: { t: TFunction }) {
  const blocks: PageBlockDto[] = [
    // Banner
    {
      banner: {
        style: "top",
        text: "This is the SaasRock demo site.",
        cta: [
          { text: "Back to SaasRock", href: "https://saasrock.com/?ref=enterprise.saasrock.com&utm_content=top-banner", isPrimary: true, target: "_blank" },
        ],
      },
    },
    // Header
    {
      header: defaultHeader,
    },
    // Hero
    {
      hero: {
        style: "simple",
        headline: t("front.hero.headline1"),
        description: t("front.hero.headline2"),
        image: "https://yahooder.sirv.com/saasrock/seo/admin-portal.png",
        cta: [
          {
            text: t("front.hero.buy"),
            href: "/pricing",
            isPrimary: true,
          },
          {
            text: t("front.hero.docs"),
            href: "/docs",
            isPrimary: false,
          },
        ],
        topText: {
          text: t("front.hero.subheadline1"),
        },
        bottomText: {
          link: {
            text: t("front.hero.hint"),
            href: "/changelog",
          },
        },
      },
    },
    // Logo Clouds
    {
      logoClouds: {
        style: "custom",
        headline: t("front.logoClouds.title"),
        logos: [
          {
            alt: "Remix",
            href: "https://remix.run/ref=saasrock.com",
            src: "https://saasrock.com/build/_assets/remix-4ESNCVZ5.png",
            srcDark: "https://saasrock.com/build/_assets/remix-dark-U2ASPSOI.png",
          },
          {
            alt: "Tailwind CSS",
            href: "https://tailwindcss.com/ref=saasrock.com",
            src: "https://saasrock.com/build/_assets/tailwindcss-G3OQBAVI.png",
          },
          {
            alt: "Prisma",
            href: "https://prisma.io/ref=saasrock.com",
            src: "https://saasrock.com/build/_assets/prisma-ATY77GXX.png",
            srcDark: "https://saasrock.com/build/_assets/prisma-dark-3FBYDJ4J.png",
          },
        ],
      },
    },
    // Gallery
    {
      gallery: {
        style: "carousel",
        topText: t("front.hero.featureImageTitle"),
        headline: t("front.hero.featureImageSub"),
        subheadline: t("front.hero.featureImageDescription"),
        items: [
          {
            type: "video",
            title: "Onboarding - SaasRock v0.8",
            src: "https://www.loom.com/embed/8acb58a663a8472d91d8a9b22c190c8e",
          },
          {
            type: "image",
            title: "Entities",
            src: "https://yahooder.sirv.com/saasrock/features/admin-portal/entities.png",
          },
        ],
      },
    },
    // Features
    {
      features: {
        style: "cards",
        topText: "More than a starter kit",
        headline: "+18 Built-in Features",
        subheadline:
          "Everything you need to start to build an MVP in a day, to build a SaaS app in a week, or a full enterprise app in less than a month (depending on your commitment ¯\\_(ツ)_/¯).",
        grid: {
          columns: "4",
        },
        items: [
          {
            name: "Admin Portal",
            description: "Manage your tenants, users, blog, analytics, logs, subscriptions, and more.",
            img: `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 32 32"> <path d="M 4 4 L 4 5 L 4 28 L 28 28 L 28 4 L 4 4 z M 6 6 L 26 6 L 26 10 L 6 10 L 6 6 z M 7 7 L 7 9 L 9 9 L 9 7 L 7 7 z M 10 7 L 10 9 L 12 9 L 12 7 L 10 7 z M 13 7 L 13 9 L 25 9 L 25 7 L 13 7 z M 6 12 L 26 12 L 26 26 L 6 26 L 6 12 z M 17.5 14 C 15.567 14 14 15.567 14 17.5 C 14 18.079 14.153344 18.617609 14.402344 19.099609 C 12.906344 20.636609 11.594969 21.990969 11.292969 22.292969 C 11.103969 22.481969 11 22.733 11 23 C 11 23.267 11.103969 23.518031 11.292969 23.707031 C 11.481969 23.896031 11.733 24 12 24 C 12.267 24 12.518031 23.896031 12.707031 23.707031 C 12.993031 23.421031 14.264484 22.18675 15.896484 20.59375 C 16.378484 20.84475 16.919 21 17.5 21 C 19.433 21 21 19.433 21 17.5 C 21 16.899 20.833406 16.341656 20.566406 15.847656 L 18 18.414062 L 16.585938 17 L 19.152344 14.433594 C 18.658344 14.166594 18.101 14 17.5 14 z"></path> </svg>`,
            link: { text: t("shared.learnMore"), href: "/docs/features/admin-portal", target: "_blank" },
          },
          {
            name: "App Portal",
            description: "End-user portal with Dashboard, Profile, Members, Subscription, and more.",
            img: `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 32 32"> <path d="M 4 4 L 4 28 L 19.273438 28 C 18.475388 29.135328 18 30.512091 18 32 L 20 32 C 20 29.226334 22.226334 27 25 27 C 27.773666 27 30 29.226334 30 32 L 32 32 C 32 29.371676 30.478925 27.157432 28.326172 25.960938 C 28.784265 25.651654 29.250971 25.337329 29.634766 25.005859 C 30.71961 24.068918 31.488281 23.136719 31.488281 23.136719 L 32.005859 22.507812 L 31.496094 21.873047 C 31.496094 21.873047 30.746239 20.936055 29.667969 19.996094 C 29.179992 19.570709 28.617107 19.131891 28 18.767578 L 28 4 L 4 4 z M 6 6 L 26 6 L 26 10 L 6 10 L 6 6 z M 7 7 L 7 9 L 9 9 L 9 7 L 7 7 z M 10 7 L 10 9 L 12 9 L 12 7 L 10 7 z M 13 7 L 13 9 L 25 9 L 25 7 L 13 7 z M 6 12 L 26 12 L 26 18.037109 C 25.835538 18.016795 25.670308 18 25.5 18 C 23.026562 18 21 20.026562 21 22.5 C 21 23.690376 21.48732 24.763027 22.25 25.570312 C 21.963342 25.693691 21.689462 25.840998 21.423828 26 L 6 26 L 6 12 z M 25.5 20 C 26.216698 20 27.424286 20.693868 28.353516 21.503906 C 28.92056 21.998216 29.043908 22.183152 29.320312 22.494141 C 29.037323 22.806248 28.905535 22.995452 28.328125 23.494141 C 27.386719 24.307199 26.16357 25 25.5 25 C 24.107438 25 23 23.892562 23 22.5 C 23 21.107438 24.107438 20 25.5 20 z"></path> </svg>`,
            link: { text: t("shared.learnMore"), href: "/docs/features/app-portal", target: "_blank" },
          },
          {
            name: "Authentication",
            description: "Login, Register, and Forgot password pages, plus Google/GitHub SSO support.",
            img: `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 32 32"> <path d="M 16 3 C 12.144531 3 9 6.144531 9 10 L 9 13 L 6 13 L 6 29 L 26 29 L 26 13 L 23 13 L 23 10 C 23 6.144531 19.855469 3 16 3 Z M 16 5 C 18.773438 5 21 7.226563 21 10 L 21 13 L 11 13 L 11 10 C 11 7.226563 13.226563 5 16 5 Z M 8 15 L 24 15 L 24 27 L 8 27 Z M 12 20 C 11.449219 20 11 20.449219 11 21 C 11 21.550781 11.449219 22 12 22 C 12.550781 22 13 21.550781 13 21 C 13 20.449219 12.550781 20 12 20 Z M 16 20 C 15.449219 20 15 20.449219 15 21 C 15 21.550781 15.449219 22 16 22 C 16.550781 22 17 21.550781 17 21 C 17 20.449219 16.550781 20 16 20 Z M 20 20 C 19.449219 20 19 20.449219 19 21 C 19 21.550781 19.449219 22 20 22 C 20.550781 22 21 21.550781 21 21 C 21 20.449219 20.550781 20 20 20 Z"></path> </svg>`,
            link: { text: t("shared.learnMore"), href: "/docs/features/authentication", target: "_blank" },
          },
          {
            name: "Subscriptions",
            description: "Stripe Flat-rate, Per-seat, One-time, and Usage-based pricing models + coupons.",
            img: `<svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 32 32"> <path d="M 5 6 C 3.355469 6 2 7.355469 2 9 L 2 23 C 2 24.644531 3.355469 26 5 26 L 27 26 C 28.644531 26 30 24.644531 30 23 L 30 9 C 30 7.355469 28.644531 6 27 6 Z M 5 8 L 27 8 C 27.566406 8 28 8.433594 28 9 L 28 23 C 28 23.566406 27.566406 24 27 24 L 5 24 C 4.433594 24 4 23.566406 4 23 L 4 9 C 4 8.433594 4.433594 8 5 8 Z M 12 10 L 10.167969 14 L 5.691406 14.582031 L 9 17.597656 L 8 22 L 12 19.75 L 16 22 L 15 17.597656 L 18.308594 14.582031 L 13.832031 14 Z M 12 14.800781 L 12.015625 14.832031 L 12.472656 15.839844 L 13.574219 15.984375 L 13.769531 16.011719 L 13.652344 16.117188 L 12.789063 16.902344 L 13.046875 18.039063 L 13.050781 18.046875 L 12.980469 18.007813 L 12 17.457031 L 11.019531 18.007813 L 10.949219 18.046875 L 10.953125 18.039063 L 11.207031 16.902344 L 10.347656 16.117188 L 10.226563 16.011719 L 10.425781 15.984375 L 11.523438 15.839844 L 11.984375 14.832031 Z M 18 20 L 18 22 L 20 22 L 20 20 Z M 21 20 L 21 22 L 23 22 L 23 20 Z M 24 20 L 24 22 L 26 22 L 26 20 Z"></path> </svg>`,
            link: { text: t("shared.learnMore"), href: "/docs/features/subscriptions", target: "_blank" },
          },
        ],
      },
    },
    // Community
    {
      community: {
        style: "simple",
        headline: "The SaasRock Community",
        subheadline: "We're all looking to build successful SaaS applications.",
        withName: false,
        type: "github",
        grid: {
          columns: "12",
          gap: "sm",
        },
        cta: [
          {
            text: "Subscribe",
            href: "/pricing",
          },
          {
            text: "Join Discord",
            href: "https://discord.gg/KMkjU2BFn9",
          },
          {
            text: "Youtube channel",
            href: "https://www.youtube.com/channel/UCdXy3FPDHxP-b7NhPspt6cQ",
          },
        ],
      },
    },
    // Testimonials
    {
      testimonials: {
        style: "simple",
        headline: "Don't take our word for it.",
        subheadline: ``,
        items: [
          {
            role: "CEO",
            company: "Piloterr",
            companyUrl: "https://www.piloterr.com/",
            logoLightMode: "https://yahooder.sirv.com/saasrock/testimonials/piloterr-light.png",
            logoDarkMode: "https://yahooder.sirv.com/saasrock/testimonials/piloterr-dark.png",
            name: "Josselin Liebe",
            personalWebsite: "https://josselinlie.be/",
            avatar: "https://avatars.githubusercontent.com/u/15314417?v=4",
            quote: "You've already solved 90% of my problems with your project :)",
          },
        ],
      },
    },
    // Newsletter
    {
      newsletter: {
        style: "simple",
        headline: t("front.newsletter.title"),
        subheadline: t("front.newsletter.headline"),
      },
    },
    // Faq
    {
      faq: {
        style: "simple",
        headline: "Frequently Asked Questions",
        items: [
          {
            question: "How do I get the code after purchasing?",
            answer:
              "You will be invited to the saasrock-core repository on GitHub. If you bought SaasRock Enterprise you will also be invited to the saasrock-enterprise repository.",
          },
          {
            question: "Can I get a refund?",
            answer: "Due to the nature of software development being a custom service, we do not offer refunds.",
          },
          {
            question: "What is a developer license?",
            answer:
              "A developer license is a license for a developer to use SaasRock for their own SaaS app development. If you need a license for your team, buy all the licenses you need.",
            link: { text: "shared.learnMore", href: "/docs/license" },
          },
        ],
      },
    },
    // Footer
    {
      footer: defaultFooter({ t }),
    },
  ];
  return blocks;
}
