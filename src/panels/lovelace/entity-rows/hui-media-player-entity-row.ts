import { html, LitElement } from "@polymer/lit-element";
import { TemplateResult } from "lit-html";
import "@polymer/paper-icon-button/paper-icon-button";

import "../components/hui-generic-entity-row";

import { hassLocalizeLitMixin } from "../../../mixins/lit-localize-mixin";
import { EntityRow, EntityConfig } from "./types";
import { HomeAssistant } from "../../../types";
import { HassEntity } from "home-assistant-js-websocket";

const SUPPORT_PAUSE = 1;
const SUPPORT_NEXT_TRACK = 32;
const SUPPORTS_PLAY = 16384;
const OFF_STATES = ["off", "idle"];

class HuiMediaPlayerEntityRow extends hassLocalizeLitMixin(LitElement)
  implements EntityRow {
  public hass?: HomeAssistant;
  private _config?: EntityConfig;

  static get properties() {
    return {
      hass: {},
      _config: {},
    };
  }

  public setConfig(config: EntityConfig): void {
    if (!config || !config.entity) {
      throw new Error("Invalid Configuration: 'entity' required");
    }

    this._config = config;
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <hui-error-entity-row
          .entity="${this._config.entity}"
        ></hui-error-entity-row>
      `;
    }

    const supportsPlay =
      // tslint:disable-next-line:no-bitwise
      stateObj.attributes.supported_features! & SUPPORTS_PLAY;
    const supportsNext =
      // tslint:disable-next-line:no-bitwise
      stateObj.attributes.supported_features! & SUPPORT_NEXT_TRACK;

    return html`
      ${this.renderStyle()}
      <hui-generic-entity-row
        .hass="${this.hass}"
        .config="${this._config}"
        .showSecondary="false"
      >
        ${
          OFF_STATES.includes(stateObj.state)
            ? html`
                <div>
                  ${
                    this.localize(`state.media_player.${stateObj.state}`) ||
                      this.localize(`state.default.${stateObj.state}`) ||
                      stateObj.state
                  }
                </div>
              `
            : html`
                <div class="controls">
                  ${
                    stateObj.state !== "playing" && !supportsPlay
                      ? ""
                      : html`
                          <paper-icon-button
                            icon="${this._computeControlIcon(stateObj)}"
                            @click="${this._playPause}"
                          ></paper-icon-button>
                        `
                  }
                  ${
                    supportsNext
                      ? html`
                          <paper-icon-button
                            icon="hass:skip-next"
                            @click="${this._nextTrack}"
                          ></paper-icon-button>
                        `
                      : ""
                  }
                </div>
                <div slot="secondary">${this._computeMediaTitle(stateObj)}</div>
              `
        }
      </hui-generic-entity-row>
    `;
  }

  private renderStyle(): TemplateResult {
    return html`
      <style>
        .controls {
          white-space: nowrap;
        }
      </style>
    `;
  }

  private _computeControlIcon(stateObj: HassEntity): string {
    if (stateObj.state !== "playing") {
      return "hass:play";
    }

    // tslint:disable-next-line:no-bitwise
    return stateObj.attributes.supported_features! & SUPPORT_PAUSE
      ? "hass:pause"
      : "hass:stop";
  }

  private _computeMediaTitle(stateObj: HassEntity): string {
    let prefix;
    let suffix;

    switch (stateObj.attributes.media_content_type) {
      case "music":
        prefix = stateObj.attributes.media_artist;
        suffix = stateObj.attributes.media_title;
        break;
      case "tvshow":
        prefix = stateObj.attributes.media_series_title;
        suffix = stateObj.attributes.media_title;
        break;
      default:
        prefix =
          stateObj.attributes.media_title ||
          stateObj.attributes.app_name ||
          stateObj.state;
        suffix = "";
    }

    return prefix && suffix ? `${prefix}: ${suffix}` : prefix || suffix || "";
  }

  private _playPause(): void {
    this.hass!.callService("media_player", "media_play_pause", {
      entity_id: this._config!.entity,
    });
  }

  private _nextTrack(): void {
    this.hass!.callService("media_player", "media_next_track", {
      entity_id: this._config!.entity,
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-media-player-entity-row": HuiMediaPlayerEntityRow;
  }
}

customElements.define("hui-media-player-entity-row", HuiMediaPlayerEntityRow);
