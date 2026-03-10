import { Helmet } from "react-helmet-async";

type SEOProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  keywords?: string;
  robots?: string;
};

const SITE_NAME = "TaskHive";
const SITE_URL = "https://taskhive.pages.dev";
const DEFAULT_IMAGE = "/placeholder.svg";
const DEFAULT_KEYWORDS = "taskhive, employee monitoring, time tracking, productivity tracker, team management";

export default function SEO({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  keywords = DEFAULT_KEYWORDS,
  robots = "index, follow"
}: SEOProps) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonicalUrl = `${SITE_URL}${normalizedPath}`;
  const imageUrl = image.startsWith("http") ? image : `${SITE_URL}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={SITE_NAME} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
