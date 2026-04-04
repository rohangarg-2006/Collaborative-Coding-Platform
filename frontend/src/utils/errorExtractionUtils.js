/**
 * Utility function to extract errors from Monaco editor markers
 */
export const extractErrorsFromMarkers = (model, monaco) => {
  if (!model || !monaco) return [];

  const markers = monaco.editor.getModelMarkers({
    resource: model.uri
  });

  return markers.map(marker => ({
    message: marker.message,
    severity: marker.severity === monaco.MarkerSeverity.Error ? 'error' : 'warning',
    startLineNumber: marker.startLineNumber,
    startColumn: marker.startColumn,
    endLineNumber: marker.endLineNumber,
    endColumn: marker.endColumn,
    source: marker.source,
    range: marker.range,
    code: marker.code,
    relatedInformation: marker.relatedInformation
  }));
};

/**
 * Sort errors by line number and severity
 */
export const sortErrors = (errors) => {
  return errors.sort((a, b) => {
    // First sort by line number
    if (a.startLineNumber !== b.startLineNumber) {
      return a.startLineNumber - b.startLineNumber;
    }
    // Then by column
    if (a.startColumn !== b.startColumn) {
      return a.startColumn - b.startColumn;
    }
    // Errors before warnings
    if (a.severity !== b.severity) {
      return a.severity === 'error' ? -1 : 1;
    }
    return 0;
  });
};

/**
 * Navigate editor to error location
 */
export const navigateToError = (editor, error) => {
  if (!editor || !error) return;

  // Reveal the line in the editor
  editor.revealLineInCenter(error.startLineNumber, 'auto');
  
  // Set selection to the error range
  editor.setSelection({
    startLineNumber: error.startLineNumber,
    startColumn: error.startColumn,
    endLineNumber: error.endLineNumber,
    endColumn: error.endColumn
  });

  // Focus the editor
  editor.focus();
};
