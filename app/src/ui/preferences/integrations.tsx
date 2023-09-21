import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { Row } from '../../ui/lib/row'
import { Select } from '../lib/select'
import { Shell, parse as parseShell } from '../../lib/shells'
import { FoundEditor, suggestedExternalEditor } from '../../lib/editors/shared'
import { TextBox } from '../lib/text-box'
import { Button } from '../lib/button'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IIntegrationsPreferencesProps {
  readonly availableEditors: ReadonlyArray<string>
  readonly selectedExternalEditor: string | null
  readonly externalCustomEditors: FoundEditor[]
  readonly availableShells: ReadonlyArray<Shell>
  readonly selectedShell: Shell
  readonly onSelectedEditorChanged: (editor: string) => void
  readonly onSelectedShellChanged: (shell: Shell) => void
  readonly onExternalCustomEditorsChanged: (externalCustomEditors: FoundEditor[]) => void
}

interface IIntegrationsPreferencesState {
  readonly selectedExternalEditor: string | null
  readonly externalCustomEditors: FoundEditor[]
  readonly selectedShell: Shell
}

export class Integrations extends React.Component<
  IIntegrationsPreferencesProps,
  IIntegrationsPreferencesState
> {
  public constructor(props: IIntegrationsPreferencesProps) {
    super(props)

    this.state = {
      selectedExternalEditor: this.props.selectedExternalEditor,
      externalCustomEditors: this.props.externalCustomEditors,
      selectedShell: this.props.selectedShell,
    }
  }

  public async componentWillReceiveProps(
    nextProps: IIntegrationsPreferencesProps
  ) {
    const editors = nextProps.availableEditors
    let selectedExternalEditor = nextProps.selectedExternalEditor
    if (editors.length) {
      const indexOf = selectedExternalEditor
        ? editors.indexOf(selectedExternalEditor)
        : -1
      if (indexOf === -1) {
        selectedExternalEditor = editors[0]
        nextProps.onSelectedEditorChanged(selectedExternalEditor)
      }
    }

    const shells = nextProps.availableShells
    let selectedShell = nextProps.selectedShell
    if (shells.length) {
      const indexOf = shells.indexOf(selectedShell)
      if (indexOf === -1) {
        selectedShell = shells[0]
        nextProps.onSelectedShellChanged(selectedShell)
      }
    }

    const externalCustomEditors = nextProps.externalCustomEditors

    this.setState({
      selectedExternalEditor,
      selectedShell,
      externalCustomEditors
    })
  }

  private onSelectedEditorChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value
    if (value) {
      this.setState({ selectedExternalEditor: value })
      this.props.onSelectedEditorChanged(value)
    }
  }

  private onSelectedShellChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = parseShell(event.currentTarget.value)
    this.setState({ selectedShell: value })
    this.props.onSelectedShellChanged(value)
  }

  private onExternalCustomEditorsChanged = (
    editors: FoundEditor[]
  ) => {
    editors = editors.filter(editor => editor.editor.length > 0)
    this.setState({ externalCustomEditors: editors })
    this.props.onExternalCustomEditorsChanged(editors)
  }

  private onExternalCustomEditorChanged = (
    knownId: number,
    editor: FoundEditor
  ) => {
    this.onExternalCustomEditorsChanged(
      this.state.externalCustomEditors.map((original, id) => {
        if (id !== knownId) {
          return original
        }
        return editor
      })
    )
  }

  private renderExternalEditor() {
    const options = this.props.availableEditors
    const selectedEditor = this.state.selectedExternalEditor
    const label = __DARWIN__ ? 'External Editor' : 'External editor'

    if (options.length === 0) {
      // this is emulating the <Select/> component's UI so the styles are
      // consistent for either case.
      //
      // TODO: see whether it makes sense to have a fallback UI
      // which we display when the select list is empty
      return (
        <div className="select-component no-options-found">
          <label>{label}</label>
          <span>
            No editors found.{' '}
            <LinkButton uri={suggestedExternalEditor.url}>
              Install {suggestedExternalEditor.name}?
            </LinkButton>
          </span>
        </div>
      )
    }

    return (
      <Select
        label={label}
        value={selectedEditor ? selectedEditor : undefined}
        onChange={this.onSelectedEditorChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    )
  }

  private renderExternalCustomEditors() {
    const label = __DARWIN__ ? 'External Custom Editors' : 'External custom editors'
    
    // the horror
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>{label}</h3>
        <table>
          <thead>
            <tr>
              <td>Name</td>
              <td>Path</td>
              <td>Terminal</td>
            </tr>
          </thead>
          <tbody>
            {this.props.externalCustomEditors.map((editor, id) => {
              return (
                <tr>
                  <td>
                    <TextBox
                      value={editor.editor}
                      onValueChanged={(name) => this.onExternalCustomEditorChanged(id, { ...editor, editor: name }) }
                    />
                  </td>
                  <td>
                    <TextBox
                      value={editor.path}
                      onValueChanged={(path) => this.onExternalCustomEditorChanged(id, { ...editor, path })}
                    />
                  </td>
                  <td>
                    <Checkbox
                      value={editor.usesShell ? CheckboxValue.On : CheckboxValue.Off}
                      onChange={() => this.onExternalCustomEditorChanged(id, { ...editor, usesShell: !editor.usesShell ? true : undefined }) }
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        
        <Row>
          <Button onClick={ () => this.onExternalCustomEditorsChanged([
            ...this.props.externalCustomEditors,
            { editor: 'An editor', path: '/path/to/editor/bin' }
          ]) }>Add</Button>
        </Row>
      </div>
    )
  }

  private renderSelectedShell() {
    const options = this.props.availableShells

    return (
      <Select
        label="Shell"
        value={this.state.selectedShell}
        onChange={this.onSelectedShellChanged}
      >
        {options.map(n => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </Select>
    )
  }

  public render() {
    return (
      <DialogContent>
        <h2>Applications</h2>
        <Row>{this.renderExternalEditor()}</Row>
        <Row>{this.renderExternalCustomEditors()}</Row>
        <Row>{this.renderSelectedShell()}</Row>
      </DialogContent>
    )
  }
}
