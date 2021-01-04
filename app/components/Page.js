import React, { useEffect } from "react";
import Container from "./Container";

function Page(props) {
  useEffect(() => {
    document.title = `${props.title} | Balanco Patrimonial`;
    //ask the browser to scroll to the top of the screen
    window.scroll(0, 0);
  }, [props.title]);

  return <Container wide={props.wide}>{props.children}</Container>;
}

export default Page;
