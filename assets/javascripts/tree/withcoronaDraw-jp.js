import * as d3 from "d3";
import data from "../../data/withcorona-jp.json";

const draw = () => {
  const width = 950,
    height = 2300;

  const pl = (data) => {
    const root = d3
      .hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.height - a.height || b.value - a.value);
    return d3.partition().size([height, ((root.height + 1) * width) / 3])(root);
  };

  // const color = d3.scaleOrdinal(
  //   d3.quantize(d3.interpolateRainbow, data.children.length + 1)
  // );

  const format = d3.format(",d");

  const rectHeight = (d) => {
    return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
  };

  const labelVisible = (d) => {
    return true;
    // return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
  };

  const root = pl(data);
  let focus = root;

  const svg = d3.select("svg#root");
  svg
    .attr("viewBox", [0, 0, width, height])
    .style("font", "8px", "Roboto Condensed");

  // magic number として 20 が設定しているなんだこれ
  const cell = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.y0 + 20}, ${d.x0})`)
    .on("mouseover", (event, data) => {
      mouseover(cell, data);
    })
    .on("mouseout", (event, data) => {
      mouseout(cell, data);
    });

  const rect = cell
    .append("rect")
    .attr("width", (d) => d.y1 - d.y0)
    .attr("height", (d) => rectHeight(d))
    .attr("fill-opacity", 1)
    .attr("fill", (d) => {
      // if (!d.depth) return "#ccc";
      // while (d.depth > 1) d = d.parent;
      // return color(d.data.name);
      return "transparent";
    })
    .style("cursor", "pointer")
    .on("click", clicked);

  const text = cell
    .append("text")
    .style("user-select", "none")
    .attr("pointer-events", "none")
    .attr("x", 4)
    .attr("y", 13)
    .attr("font-family", "Roboto Condensed")
    .attr("font-size", "14px")
    .attr("font-weight", "400")
    .attr("fill-opacity", (d) => +labelVisible(d));

  text.append("tspan").text((d) => d.data.name);

  const tspan = text
    .append("tspan")
    .attr("fill-opacity", (d) => labelVisible(d) * 0.7)
    .text((d) => ``);

  // append title
  cell.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join("/")}\n${format(d.value)}`
  );

  // append Hashtags
  const tags = [];
  const hashtagOffsetY = 24;
  cell.each((c, i, nodes) => {
    if (c.children) return;
    if (!c.data.tags) return;
    const target = d3.select(nodes[i]);
    let cnt = 0;
    for (const tag of c.data.tags) {
      const _tag = target
        .append("text")
        .style("cursor", "pointer")
        .attr("data-tag", tag)
        .attr("x", 16)
        .attr("y", 16 * cnt + hashtagOffsetY)
        .attr("font-family", "Roboto Condensed")
        .attr("font-size", "14px")
        .attr("font-weight", "400")
        .on("click", function (e, d) {
          console.log(this.dataset.tag);
          location.href = `./cards-jp.html?tag=${this.dataset.tag}`;
        });
      tags.push(_tag);
      _tag.append("tspan").text(tag);
      cnt++;
    }
  });

  // append descriptions
  const descriptions = [];
  cell.each((c, i, nodes) => {
    if (!c.data.description) return;
    const target = d3.select(nodes[i]);
    const str = c.data.description;
    const strSplitted = str.split("\n");
    console.log(strSplitted);
    const description = target
      .append("text")
      .style("cursor", "pointer")
      .attr("x", 40)
      .attr("y", 80)
      .on("click", function () {
        // TODO: リンクにパラメータ入れる
        location.href =
          "./cards-jp.html?card_id=" + c.data.card_id + "#" + c.data.card_id;
      });
    let cnt = 0;
    const lineHeight = 14;
    for (const s of strSplitted) {
      description
        .append("tspan")
        .text(s)
        .attr("font-family", "Roboto Condensed")
        .attr("font-size", "12px")
        .attr("font-weight", "400")
        .attr("x", 0)
        .attr("y", 80 + cnt * lineHeight);
      cnt++;
    }
    description
      .append("tspan")
      .text("Go to  overview ideas →")
      .style("text-decoration", "underline")
      .attr("font-family", "Roboto Condensed")
      .attr("font-size", "12px")
      .attr("font-weight", "400")
      .attr("x", 0)
      .attr("y", 80 + (cnt + 1) * lineHeight);
    descriptions.push(description);
  });
  console.log(descriptions);

  // append lines
  const lines = [];
  const lineOffsetY = 20;
  cell.each((c, i, nodes) => {
    if (!c.children) return;
    const count = c.children.length || 0;
    const target = d3.select(nodes[i]);
    const sum = c.children.reduce((prev, cur) => {
      return (prev += cur.value);
    }, 0);

    let curValue = 0;
    for (let i = 0; i < count; i++) {
      if (i > 0) {
        // console.log("value", c.children[i - 1].value);
        curValue += c.children[i - 1].value;
      }
      let per;
      if (sum === 0) {
        per = 0;
      } else {
        per = curValue / sum;
      }

      const line = target
        .append("line")
        .attr("x1", (d) => 0)
        .attr("x2", (d) => d.y1 - d.y0)
        .attr("y1", (d) => 0 + lineOffsetY)
        .attr("y2", (d) => {
          return rectHeight(d) * per + lineOffsetY;
        })
        .attr("stroke-width", 1)
        .attr("stroke", "#222")
        .attr("per", per);

      lines.push(line);
    }
  });

  // append circle
  cell
    .append("circle")
    .attr("cx", 4 - 6 / 2)
    .attr("cy", lineOffsetY)
    .attr("r", 4)
    .attr("fill", "black");

  function clicked(event, p) {
    focus = focus === p ? (p = p.parent) : p;
    if (focus == null) {
      return;
    }

    // header move
    const depth = p.depth;
    document.querySelector("#header .floating").dataset.depth = depth;

    root.each(
      (d) =>
        (d.target = {
          x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
          x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
          y0: d.y0 - p.y0 + lineOffsetY,
          y1: d.y1 - p.y0 + lineOffsetY,
        })
    );

    // !!!!! ease の default は d3.easeCubic
    // !!!!! css の header の easing と同期させること
    const t = cell
      .transition()
      .duration(750)
      .ease(d3.easeLinear)
      .attr("transform", (d) => `translate(${d.target.y0}, ${d.target.x0})`);

    rect.transition(t).attr("height", (d) => rectHeight(d.target));

    text.transition(t).attr("fill-opacity", (d) => +labelVisible(d.target));

    for (let line of lines) {
      line.transition(t).attr("y2", (d) => {
        return rectHeight(d.target) * line.attr("per") + lineOffsetY;
      });
    }

    tspan
      .transition(t)
      .attr("fill-opacity", (d) => labelVisible(d.target) * 0.7);
  }

  return svg.node();
};

function activateAllChildren(rootData) {
  const targets = [];
  rootData.isActive = true;
  if (rootData.children) {
    for (const child of rootData.children) {
      targets.push(child);
    }
  }

  // const result = [rootData];

  while (targets.length != 0) {
    const t = targets.shift();
    // result.push(t);
    t.isActive = true;
    if (t.children) {
      for (const child of t.children) {
        targets.push(child);
      }
    }
  }
  // console.log("activate", result);
}

function inactivateAllChildren(rootData) {
  const targets = [];
  rootData.isActive = false;
  if (rootData.children) {
    for (const child of rootData.children) {
      targets.push(child);
    }
  }

  // const result = [rootData];

  while (targets.length != 0) {
    const t = targets.shift();
    // result.push(t);
    t.isActive = false;
    if (t.children) {
      for (const child of t.children) {
        targets.push(child);
      }
    }
  }
  // console.log("inactivate", result);
}

function mouseover(cell, eventRootData) {
  activateAllChildren(eventRootData);
  cell.classed("isActive", (d) => {
    return d.isActive;
  });
}

function mouseout(cell, eventRootData) {
  inactivateAllChildren(eventRootData);
  cell.classed("isActive", (d) => {
    return d.isActive;
  });
}

export default draw;
