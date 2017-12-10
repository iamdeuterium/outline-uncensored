// @flow
import React, { Component } from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { Portal } from 'react-portal';
import { Editor, findDOMNode } from 'slate-react';
import { Node, Value } from 'slate';
import styled from 'styled-components';
import _ from 'lodash';
import FormattingToolbar from './components/FormattingToolbar';
import LinkToolbar from './components/LinkToolbar';

function getLinkInSelection(value): any {
  try {
    const selectedLinks = value.document
      .getInlinesAtRange(value.selection)
      .filter(node => node.type === 'link');
    if (selectedLinks.size) {
      return selectedLinks.first();
    }
  } catch (err) {
    // It's okay.
  }
}

@observer
export default class Toolbar extends Component {
  @observable active: boolean = false;
  @observable link: ?Node;
  @observable top: string = '';
  @observable left: string = '';

  props: {
    editor: Editor,
    value: Value,
  };

  menu: HTMLElement;

  componentDidMount = () => {
    this.update();
  };

  componentDidUpdate = () => {
    this.update();
  };

  hideLinkToolbar = () => {
    this.link = undefined;
  };

  showLinkToolbar = (ev: SyntheticEvent) => {
    ev.preventDefault();
    ev.stopPropagation();

    const link = getLinkInSelection(this.props.value);
    this.link = link;
  };

  update = () => {
    const { value } = this.props;
    const link = getLinkInSelection(value);

    if (value.isBlurred || (value.isCollapsed && !link)) {
      if (this.active && !this.link) {
        this.active = false;
        this.link = undefined;
        this.top = '';
        this.left = '';
      }
      return;
    }

    // don't display toolbar for document title
    const firstNode = value.document.nodes.first();
    if (firstNode === value.startBlock) return;

    // don't display toolbar for code blocks, code-lines inline code.
    if (value.startBlock.type.match(/code/)) return;

    this.active = true;
    this.link = this.link || link;

    const padding = 16;
    const selection = window.getSelection();
    let rect;

    if (link) {
      rect = findDOMNode(link).getBoundingClientRect();
    } else if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      rect = range.getBoundingClientRect();
    }

    if (!rect || (rect.top === 0 && rect.left === 0)) {
      return;
    }

    const left =
      rect.left + window.scrollX - this.menu.offsetWidth / 2 + rect.width / 2;
    this.top = `${Math.round(
      rect.top + window.scrollY - this.menu.offsetHeight
    )}px`;
    this.left = `${Math.round(Math.max(padding, left))}px`;
  };

  setRef = (ref: HTMLElement) => {
    this.menu = ref;
  };

  render() {
    const style = {
      top: this.top,
      left: this.left,
    };

    return (
      <Portal>
        <Menu active={this.active} innerRef={this.setRef} style={style}>
          {this.link ? (
            <LinkToolbar
              {...this.props}
              link={this.link}
              onBlur={this.hideLinkToolbar}
            />
          ) : (
            <FormattingToolbar
              onCreateLink={this.showLinkToolbar}
              {...this.props}
            />
          )}
        </Menu>
      </Portal>
    );
  }
}

const Menu = styled.div`
  padding: 8px 16px;
  position: absolute;
  z-index: 2;
  top: -10000px;
  left: -10000px;
  opacity: 0;
  background-color: #2f3336;
  border-radius: 4px;
  transform: scale(0.95);
  transition: opacity 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 150ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
  line-height: 0;
  height: 40px;
  min-width: 260px;

  ${({ active }) =>
    active &&
    `
    transform: translateY(-6px) scale(1);
    opacity: 1;
  `};

  @media print {
    display: none;
  }
`;
