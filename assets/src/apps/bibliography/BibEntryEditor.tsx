import * as React from 'react';
import * as Immutable from 'immutable';
import { useState } from 'react';
import { CitationModel, DateField, isDateField, isNameField, NameField } from './citation_model';
import { TextInput } from 'components/common/TextInput';
import { cslSchema, ignoredAttributes, toFriendlyLabel } from './common';

export interface BibEntryEditorProps {
  citationModel: CitationModel;
  create: boolean;
  onEdit: (content: CitationModel) => void;
}

export const BibEntryEditor: React.FC<BibEntryEditorProps> = (props: BibEntryEditorProps) => {
  const [model, setModel] = useState<CitationModel>({ ...props.citationModel });

  const allFields: Immutable.List<string> = Immutable.List<string>(
    Object.keys(cslSchema.items.properties) as any,
  );

  const onEditString = (key: string, value: string) => {
    const newModel = { ...model, [key]: value };
    setModel(newModel);
    props.onEdit({ ...newModel });
  };

  const onEditNameEditor = (index: number, key: string, key2: string, value: string) => {
    const updateModel = { ...model };
    const entry = Object.entries(updateModel).find(([k, _v]) => k === key);
    if (entry) {
      let val = entry[1][index];
      val = { ...val, [key2]: value };
      entry[1].splice(index, 1, val);
      setModel(updateModel);
      props.onEdit({ ...updateModel });
    }
  };

  const onEditDateEditor = (index: number, key: string, key2: string, value: string) => {
    let updateModel = { ...model };
    const entry = Object.entries(updateModel).find(([k, _v]) => k === key);
    if (entry) {
      let val = entry[1];
      if (index > -1) {
        val = val[key2];
        val[0].splice(index, 1, value);
      } else {
        val = { ...val, [key2]: value };
        updateModel = { ...updateModel, [key]: val };
      }
      setModel(updateModel);
      props.onEdit({ ...updateModel });
    }
  };

  const renderStringEditor = (key: string, value: string) => {
    return (
      <TextInput
        editMode={true}
        width="100%"
        value={value}
        label=""
        type="string"
        onEdit={(v) => onEditString(key, v)}
      />
    );
  };

  const renderDateEditor = (key: string, value: DateField) => {
    return (
      <div className="ml-4">
        {Object.entries(value).map(([k, val]) => (
          <div key={k} className="form-row form-group">
            <label className="control-label" htmlFor={k}>
              {renderLabel(k)}
            </label>
            <div className="col-sm-12">
              {k === 'date-parts' ? (
                <div className="d-flex">
                  <div className="col-sm-4">
                    <TextInput
                      editMode={true}
                      width="100%"
                      value={val[0][0]}
                      label="Year"
                      type="string"
                      onEdit={(v) => {
                        onEditDateEditor(0, key, k, v);
                      }}
                    />
                  </div>
                  <div className="col-sm-4">
                    <TextInput
                      editMode={true}
                      width="100%"
                      value={val[0].length > 1 ? val[0][1] : ''}
                      label="Month"
                      type="string"
                      onEdit={(v) => {
                        onEditDateEditor(1, key, k, v);
                      }}
                    />
                  </div>
                  <div className="col-sm-4">
                    <TextInput
                      editMode={true}
                      width="100%"
                      value={val[0].length > 2 ? val[0][2] : ''}
                      label="Day"
                      type="string"
                      onEdit={(v) => {
                        onEditDateEditor(2, key, k, v);
                      }}
                    />
                  </div>
                </div>
              ) : (
                <TextInput
                  editMode={true}
                  width="100%"
                  value={val}
                  label=""
                  type="string"
                  onEdit={(v) => {
                    onEditDateEditor(-1, key, k, v);
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderNameField = (index: number, key: string, value: NameField) => {
    return (
      <div className="d-flex">
        {Object.entries(value).map(([k, val]) => (
          <div key={k} className="col-sm-6">
            <TextInput
              editMode={true}
              width="100%"
              value={val}
              label={renderLabel(k)}
              type="string"
              onEdit={(v) => onEditNameEditor(index, key, k, v)}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderNameEditor = (key: string, values: NameField[]) => {
    return (
      <div className="ml-4">
        {values.map((e, index) => (
          <div key={index} className="form-horizontal">
            {renderNameField(index, key, e)}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-link"
          onClick={() => {
            setModel({ ...model, [key]: [...values, { given: '', family: '' }] });
          }}
        >
          <i className="las la-solid la-plus"></i> {'Add ' + toFriendlyLabel(key)}
        </button>
      </div>
    );
  };

  const renderLabel = (key: string) => {
    return toFriendlyLabel(key);
  };

  const renderAttributeEditor = (key: string, value: any) => {
    if (value === undefined) {
      return null;
    }
    if (typeof value === 'string') {
      return renderStringEditor(key, value);
    }

    if (isNameField(key)) {
      return renderNameEditor(key, value);
    }

    if (isDateField(key)) {
      return renderDateEditor(key, value);
    }
  };

  const initDefaultValue = (key: string) => {
    if (isNameField(key)) {
      return [{ given: '', family: '' }];
    }
    if (isDateField(key)) {
      const c = new Date();
      return { 'date-parts': [[c.getFullYear(), c.getMonth() + 1, c.getDate()]] };
    }
    return '';
  };

  const renderField = (key1: string, value1: any) => {
    return (
      <div key={key1} className="form-row form-group">
        <label className="control-label" htmlFor={key1}>
          {renderLabel(key1)}
        </label>
        <button
          onClick={() => {
            let m: CitationModel = { id: '', type: '' };
            m = Object.entries(model).reduce(function (obj, entry) {
              if (entry[0] != key1) {
                obj = { ...obj, [entry[0]]: entry[1] };
              }
              return obj;
            }, m);

            setModel(m);
          }}
          type="button"
          className="btn btn-link p-0"
          data-toggle="tooltip"
          data-placement="top"
          title="Delete this field"
          aria-pressed="false"
        >
          <i className="las la-trash-alt"></i>
        </button>
        <div className="col-sm-12">{renderAttributeEditor(key1, value1)}</div>
      </div>
    );
  };

  const renderAttributeEditors = () => {
    const editors = [];
    for (const [key, value] of Object.entries(model)) {
      if (!Object.keys(ignoredAttributes).find((e) => e === key)) {
        editors.push(renderField(key, value));
      }
    }
    return editors;
  };

  const createEntryDropdown = () => {
    const attrs = allFields.filter(
      (key: string) =>
        !Object.keys(ignoredAttributes).find((el) => el === key) &&
        !Object.keys(model).find((el) => el === key),
    );
    return (
      <div className="form-inline">
        <div className="dropdown">
          <button
            type="button"
            id="createButton"
            className="btn btn-link dropdown-toggle btn-purpose"
            data-toggle="dropdown"
            aria-haspopup="true"
            aria-expanded="false"
          >
            Add Field
          </button>
          <div className="dropdown-menu" aria-labelledby="createButton">
            <div className="overflow-auto bg-light" style={{ maxHeight: '300px' }}>
              {attrs.map((e: string) => (
                <a
                  onClick={() => {
                    setModel({ ...model, [e]: initDefaultValue(e) });
                  }}
                  className="dropdown-item"
                  href="#"
                  key={e}
                >
                  {toFriendlyLabel(e)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const createEntryTypeDropdown = (
    <div className="form-inline">
      <div className="dropdown">
        <button
          type="button"
          id="createButton"
          className="btn btn-link dropdown-toggle btn-purpose"
          data-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          {toFriendlyLabel(model.type).toUpperCase()}
        </button>
        <div className="dropdown-menu" aria-labelledby="createButton">
          <div className="overflow-auto bg-light" style={{ maxHeight: '300px' }}>
            {cslSchema.items.properties['type'].enum.map((e: string) => (
              <a
                onClick={() => {
                  onEditString('type', e);
                }}
                className="dropdown-item"
                href="#"
                key={e}
              >
                {toFriendlyLabel(e)}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div>{createEntryTypeDropdown}</div>
      <div className="overflow-auto form-horizontal p-3 bg-light" style={{ maxHeight: '400px' }}>
        {renderAttributeEditors()}
      </div>
      {createEntryDropdown()}
    </div>
  );
};