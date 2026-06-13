import { z } from 'zod';
import { DISTRICTS } from '../constants/districts';
import { SERVICE_TYPES } from '../constants/services';
import { PICKUP_STATUSES } from '../constants/statuses';

export const reportPeriodSchema = z
  .object({
    startDate: z.iso.date(),
    endDate: z.iso.date(),
  })
  .superRefine((period, context) => {
    const start = Date.parse(`${period.startDate}T00:00:00Z`);
    const end = Date.parse(`${period.endDate}T00:00:00Z`);
    const days = Math.floor((end - start) / 86_400_000) + 1;

    if (end < start) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Tanggal akhir tidak boleh sebelum tanggal mulai.',
      });
    } else if (days > 31) {
      context.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Periode laporan maksimal 31 hari.',
      });
    }
  });

export const operationalReportSchema = z.object({
  period: reportPeriodSchema,
  totals: z.object({
    created: z.number().int().nonnegative(),
    scheduled: z.number().int().nonnegative(),
    completed: z.number().int().nonnegative(),
    extraTrip: z.number().int().nonnegative(),
    cancelled: z.number().int().nonnegative(),
    completionRate: z.number().min(0).max(100),
  }),
  byDistrict: z.record(z.enum(DISTRICTS), z.number().int().nonnegative()),
  byServiceType: z.record(
    z.enum(SERVICE_TYPES),
    z.number().int().nonnegative(),
  ),
  daily: z.array(
    z.object({
      date: z.iso.date(),
      created: z.number().int().nonnegative(),
      scheduled: z.number().int().nonnegative(),
      completed: z.number().int().nonnegative(),
      extraTrip: z.number().int().nonnegative(),
    }),
  ),
  rows: z.array(
    z.object({
      ticketCode: z.string(),
      createdDate: z.iso.date(),
      scheduledDate: z.iso.date().optional(),
      completedDate: z.iso.date().optional(),
      district: z.enum(DISTRICTS),
      serviceType: z.enum(SERVICE_TYPES),
      status: z.enum(PICKUP_STATUSES),
      driverName: z.string().optional(),
    }),
  ),
});

export type ReportPeriod = z.infer<typeof reportPeriodSchema>;
export type OperationalReport = z.infer<typeof operationalReportSchema>;
