import Carousel from "../images/Carousel";

interface Props {
  items: {
    type: string;
    title: string;
    src: string;
  }[];
}

export default function DocCarousel({ items }: Props) {
  return <Carousel items={items} />;
}
