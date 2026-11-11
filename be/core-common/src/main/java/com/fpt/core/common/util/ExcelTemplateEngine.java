package com.fpt.core.common.util;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.core.io.ClassPathResource;

import org.jspecify.annotations.NonNull;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

/**
 * Author: hoanglm21@fpt.com
 * Date: 06/05/2026
 */
public class ExcelTemplateEngine implements AutoCloseable {

    private final Workbook workbook;
    private final ByteArrayOutputStream os;

    public ExcelTemplateEngine(@NonNull String templatePath) throws IOException {
        ClassPathResource resource = new ClassPathResource(templatePath);
        try (InputStream is = resource.getInputStream()) {
            this.workbook = new XSSFWorkbook(is);
        }
        this.os = new ByteArrayOutputStream();
    }

    public void writeSheet(String sheetName, List<List<Object>> data, int startRow) {
        Sheet sheet = workbook.getSheet(sheetName);
        if (sheet == null) {
            sheet = workbook.createSheet(sheetName);
        }

        int lastRow = sheet.getLastRowNum();
        for (int i = lastRow; i >= startRow; i--) {
            Row row = sheet.getRow(i);
            if (row != null) {
                sheet.removeRow(row);
            }
        }

        CellStyle cellStyle = workbook.createCellStyle();
        cellStyle.setBorderTop(BorderStyle.THIN);
        cellStyle.setBorderBottom(BorderStyle.THIN);
        cellStyle.setBorderLeft(BorderStyle.THIN);
        cellStyle.setBorderRight(BorderStyle.THIN);

        int rowIdx = startRow;
        for (List<Object> rowData : data) {
            Row row = sheet.createRow(rowIdx++);
            int colIdx = 0;
            for (Object value : rowData) {
                Cell cell = row.createCell(colIdx++);
                cell.setCellStyle(cellStyle);
                if (value instanceof Number) {
                    cell.setCellValue(((Number) value).doubleValue());
                } else if (value instanceof Boolean) {
                    cell.setCellValue((Boolean) value);
                } else if (value != null) {
                    cell.setCellValue(value.toString());
                }
            }
        }
    }

    public byte[] toBytes() throws IOException {
        workbook.write(os);
        return os.toByteArray();
    }

    @Override
    public void close() throws Exception {
        if (workbook != null) {
            workbook.close();
        }
        if (os != null) {
            os.close();
        }
    }
}
